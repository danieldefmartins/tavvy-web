import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {onTheGoActor,onTheGoError,OnTheGoHttpError} from "../_shared/onthego-http.ts";

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
    const {user}=await onTheGoActor(req);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) throw new OnTheGoHttpError("Service unavailable",503);
    const supabase = createClient(supabaseUrl, supabaseServiceKey,{auth:{persistSession:false,autoRefreshToken:false}});

    // Get user's On The Go places from tavvy_places
    const { data: myPlaces, error: placesError } = await supabase
      .from("tavvy_places")
      .select("id, name, tavvy_category, cover_image_url, place_type, is_active_today, current_address, service_area")
      .eq("created_by", user.id)
      .eq("place_type", "on_the_go")
      .eq("is_deleted", false);

    if (placesError) {
      console.error("Places query error:", placesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch places" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!myPlaces || myPlaces.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          has_on_the_go_places: false,
          places: [],
          active_sessions: [],
          sessions: [],
          message: "You don't have any On The Go businesses yet.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const placeIds = myPlaces.map(p => p.id);

    // Get active sessions for user's places
    const { data: activeSessions, error: sessionsError } = await supabase
      .from("live_sessions")
      .select(`
        id,
        tavvy_place_id,
        session_lat,
        session_lng,
        location_label,
        session_address,
        address_confirmed,
        today_note,
        started_at,
        scheduled_end_at,
        status
      `)
      .in("tavvy_place_id", placeIds)
      .eq("status", "active")
      .gt("scheduled_end_at", new Date().toISOString());

    if (sessionsError) {
      return new Response(JSON.stringify({ error: "Failed to recover sessions" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get menu items and specials for active sessions
    const sessionsWithContent = await Promise.all(
      (activeSessions || []).map(async (session: any) => {
        const [menuResult, specialsResult] = await Promise.all([
          supabase
            .from("live_session_menu_items")
            .select("id, name, description, price_cents, is_available, sort_order")
            .eq("session_id", session.id)
            .order("sort_order"),
          supabase
            .from("live_session_specials")
            .select("id, title, description, valid_until, urgency_label")
            .eq("session_id", session.id),
        ]);

        if(menuResult.error||specialsResult.error)throw new Error("Session content unavailable");
        return {
          ...session,
          menu_items: menuResult.data || [],
          specials: specialsResult.data || [],
        };
      })
    );

    // Get session history (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentSessions,error:recentError } = await supabase
      .from("live_sessions")
      .select(`
        id,
        tavvy_place_id,
        session_address,
        started_at,
        actual_end_at,
        status
      `)
      .in("tavvy_place_id", placeIds)
      .gte("started_at", sevenDaysAgo.toISOString())
      .order("started_at", { ascending: false })
      .limit(20);

    if(recentError)throw new Error("Session history unavailable");

    // Calculate stats
    const totalSessions = recentSessions?.length || 0;
    const totalMinutes = (recentSessions || []).reduce((acc, s) => {
      if (s.started_at && s.actual_end_at) {
        const start = new Date(s.started_at);
        const end = new Date(s.actual_end_at);
        return acc + (end.getTime() - start.getTime()) / 60000;
      }
      return acc;
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    // Enrich places with active session info
    const activePlaceIds = (activeSessions || []).map((s: any) => s.tavvy_place_id);
    const enrichedPlaces = myPlaces.map(place => {
      const activeSession = sessionsWithContent.find(s => s.tavvy_place_id === place.id);
      return {
        ...place,
        is_live: activePlaceIds.includes(place.id),
        active_session: activeSession || null,
      };
    });

    // Places available to go live (not currently active)
    const availablePlaces = enrichedPlaces.filter(p => !p.is_live);

    return new Response(
      JSON.stringify({
        success: true,
        has_on_the_go_places: true,
        has_active_session: sessionsWithContent.length > 0,
        places: enrichedPlaces,
        sessions: sessionsWithContent,
        available_places: availablePlaces,
        stats: {
          sessions_this_week: totalSessions,
          total_live_time: `${hours}h ${minutes}m`,
        },
        recent_sessions: recentSessions || [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("My active session error:", error);
    return new Response(
      JSON.stringify({ error: onTheGoError(error)===500 ? "Internal server error" : (error as Error).message }),
      { status: onTheGoError(error), headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
