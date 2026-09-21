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

    // Get session_id from URL or body
    let session_id: string;
    
    if (req.method === "GET") {
      const url = new URL(req.url);
      session_id = url.searchParams.get("session_id") || "";
    } else {
      const body = await req.json();
      session_id = body.session_id;
    }

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: session_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from("live_sessions")
      .select(`
        id,
        place_id,
        tavvy_place_id,
        session_address,
        session_lat,
        session_lng,
        location_label,
        today_note,
        started_at,
        scheduled_end_at,
        status
      `)
      .eq("id", session_id)
      .eq("status", "active")
      .gt("scheduled_end_at", new Date().toISOString())
      .single();

    if(sessionError && sessionError.code!=="PGRST116")throw new Error("Session lookup unavailable");
    if (!session) {
      return new Response(
        JSON.stringify({ error: "Session not found or no longer active" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get place details
    const { data: place, error: placeError } = await supabase
      .from(session.tavvy_place_id ? "tavvy_places" : "places")
      .select(`
        id,
        name,
        tavvy_category,
        tavvy_subcategory,
        cover_image_url,
        phone,
        website,
        service_area
      `)
      .eq("id", session.tavvy_place_id || session.place_id)
      .single();

    if (placeError) {
      throw new Error("Place details unavailable");
    }

    // Get menu items for this session
    const { data: menuItems, error: menuError } = await supabase
      .from("live_session_menu_items")
      .select(`
        id,
        name,
        description,
        price_cents,
        is_available,
        sort_order
      `)
      .eq("session_id", session_id)
      .order("sort_order", { ascending: true });

    if (menuError) {
      throw new Error("Menu items unavailable");
    }

    // Get specials for this session
    const { data: specials, error: specialsError } = await supabase
      .from("live_session_specials")
      .select(`
        id,
        title,
        description,
        valid_until,
        urgency_label
      `)
      .eq("session_id", session_id);

    if (specialsError) {
      throw new Error("Specials unavailable");
    }

    // Get active stories for this place (if any)
    const { data: stories, error: storiesError } = await supabase
      .from("place_stories")
      .select(`
        id,
        media_url,
        media_type,
        caption,
        thumbnail_url,
        created_at,
        expires_at,story_kind,is_permanent
      `)
      .eq("place_id", session.place_id)
      .eq("status", "active")
      .or(`expires_at.gt.${new Date().toISOString()},and(is_permanent.eq.true,story_kind.eq.owner_highlight)`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (storiesError) {
      throw new Error("Stories unavailable");
    }

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          id: session.id,
          place_id:session.place_id,
          tavvy_place_id:session.tavvy_place_id,
          session_address:session.session_address,
          session_lat: session.session_lat,
          session_lng: session.session_lng,
          location_label: session.location_label,
          today_note: session.today_note,
          started_at: session.started_at,
          scheduled_end_at: session.scheduled_end_at,
          status: session.status,
        },
        place: place || null,
        menu_items: menuItems || [],
        specials: specials || [],
        stories: stories || [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Session details error:", error);
    return new Response(
      JSON.stringify({ error: onTheGoError(error)===500 ? "Internal server error" : (error as Error).message }),
      { status: onTheGoError(error), headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});