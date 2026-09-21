import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {onTheGoReader,onTheGoError} from "../_shared/onthego-http.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "private, no-store",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if(!["GET","POST"].includes(req.method))return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:corsHeaders});

  try {
    const supabase = await onTheGoReader(req);

    // Get tavvy_place_id from query params
    const url = new URL(req.url);
    const tavvyPlaceId = url.searchParams.get("tavvy_place_id");
    const limit = Number(url.searchParams.get("limit") || "10");
    const includePlace = url.searchParams.get("include_place") === "true";

    if (!tavvyPlaceId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tavvyPlaceId) || !Number.isInteger(limit) || limit<1 || limit>100) {
      return new Response(
        JSON.stringify({ error: "Use a valid business ID and a limit from 1 to 100" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the place info if requested
    let placeInfo = null;
    if (includePlace) {
      const { data: place, error: placeError } = await supabase
        .from("tavvy_places")
        .select("id, name, tavvy_category, cover_image_url, phone, service_area, is_active_today, current_address")
        .eq("id", tavvyPlaceId)
        .single();
      
      if(placeError && placeError.code!=="PGRST116") throw new Error("Business details unavailable");
      placeInfo = place;
    }

    // Get upcoming scheduled events
    const { data: events, error: eventsError } = await supabase
      .from("scheduled_events")
      .select(`
        id,
        event_title,
        event_description,
        location_name,
        location_address,
        latitude,
        longitude,
        scheduled_start,
        scheduled_end,
        is_recurring,
        recurrence_rule
      `)
      .eq("tavvy_place_id", tavvyPlaceId)
      .eq("status", "scheduled")
      .gt("scheduled_end", new Date().toISOString())
      .order("scheduled_start", { ascending: true })
      .limit(limit);

    if (eventsError) {
      console.error("Events query error:", eventsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch schedule" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format events with relative time
    const formattedEvents = (events || []).map((event: any) => {
      const startDate = new Date(event.scheduled_start);
      const endDate = new Date(event.scheduled_end);
      const now = new Date();
      
      // Calculate days until event
      const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Format date string
      const dateOptions: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      };
      const timeOptions: Intl.DateTimeFormatOptions = { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      };
      
      const dateStr = startDate.toLocaleDateString('en-US', dateOptions);
      const startTimeStr = startDate.toLocaleTimeString('en-US', timeOptions);
      const endTimeStr = endDate.toLocaleTimeString('en-US', timeOptions);
      
      let relativeTime = "";
      if (daysUntil === 0) {
        relativeTime = "Today";
      } else if (daysUntil === 1) {
        relativeTime = "Tomorrow";
      } else if (daysUntil < 7) {
        relativeTime = `In ${daysUntil} days`;
      } else {
        relativeTime = dateStr;
      }

      return {
        ...event,
        formatted_date: dateStr,
        formatted_time: `${startTimeStr} - ${endTimeStr}`,
        relative_time: relativeTime,
        days_until: daysUntil,
      };
    });

    // Check if there's an active session right now
    const { data: activeSession, error: sessionError } = await supabase
      .from("live_sessions")
      .select("id, session_address, scheduled_end_at")
      .eq("tavvy_place_id", tavvyPlaceId)
      .eq("status", "active")
      .eq("address_confirmed", true)
      .gt("scheduled_end_at", new Date().toISOString())
      .single();

    if(sessionError && sessionError.code!=="PGRST116") throw new Error("Live status unavailable");
    return new Response(
      JSON.stringify({
        success: true,
        tavvy_place_id: tavvyPlaceId,
        place: placeInfo ? { ...placeInfo, is_active_today: !!activeSession, current_address: activeSession?.session_address || "Business offline" } : null,
        is_live_now: !!activeSession,
        active_session: activeSession || null,
        has_upcoming_events: formattedEvents.length > 0,
        event_count: formattedEvents.length,
        events: formattedEvents,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get schedule error:", error);
    return new Response(
      JSON.stringify({ error: onTheGoError(error)===500 ? "Internal server error" : (error as Error).message }),
      { status: onTheGoError(error), headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
