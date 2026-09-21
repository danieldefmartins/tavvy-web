import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {onTheGoActor,onTheGoError,OnTheGoHttpError} from "../_shared/onthego-http.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "private, no-store",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOnTheGoPlaceRequest {
  name: string;
  tavvy_category: string;
  tavvy_subcategory?: string;
  description?: string;
  service_area: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  cover_image_url?: string;
}

// Valid On The Go categories
const VALID_CATEGORIES = [
  "Food Trucks",
  "Mobile Services",
  "Pop-ups",
  "Mobile Retail",
  "Event Services",
  "Mobile Health & Wellness",
  "Mobile Pet Services",
  "Mobile Entertainment",
];

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if(req.method!=="POST")return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:corsHeaders});

  try {
    const {user}=await onTheGoActor(req);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) throw new OnTheGoHttpError("Service unavailable",503);
    const supabase = createClient(supabaseUrl, supabaseServiceKey,{auth:{persistSession:false,autoRefreshToken:false}});

    const body: CreateOnTheGoPlaceRequest = await req.json().catch(()=>{throw new OnTheGoHttpError("Invalid request body");});
    if (!body || typeof body!=="object" || Array.isArray(body)) throw new OnTheGoHttpError("Invalid request body");
    const { 
      name, 
      tavvy_category, 
      tavvy_subcategory,
      description,
      service_area, 
      phone, 
      email, 
      website, 
      instagram, 
      facebook,
      cover_image_url 
    } = body;

    const fields={name,tavvy_category,tavvy_subcategory,description,service_area,phone,email,website,instagram,facebook,cover_image_url};
    if(Object.entries(fields).some(([key,value])=>value!=null&&(typeof value!=='string'||value.length>(key==='description'?4000:500))) || typeof name!=='string' || !name.trim() || typeof service_area!=='string' || !service_area.trim() || [website,instagram,facebook,cover_image_url].some(value=>value&& !/^https?:\/\/[^\s]+$/i.test(value)))return new Response(JSON.stringify({error:'Enter valid business details and full website links.'}),{status:400,headers:corsHeaders});
    // Validate required fields
    if (!name || !tavvy_category || !service_area) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, tavvy_category, service_area" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(tavvy_category)) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid category", 
          valid_categories: VALID_CATEGORIES 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already has a place with this name
    const { data: existingPlace, error: lookupError } = await supabase
      .from("tavvy_places")
      .select("id")
      .eq("created_by", user.id)
      .eq("name", name)
      .eq("is_deleted", false)
      .single();

    if (lookupError && lookupError.code !== "PGRST116") throw new Error("Business lookup unavailable");
    if (existingPlace) {
      return new Response(
        JSON.stringify({ error: "You already have a business with this name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the On The Go place
    const { data: newPlace, error: createError } = await supabase
      .from("tavvy_places")
      .insert({
        name,
        tavvy_category,
        tavvy_subcategory: tavvy_subcategory || null,
        description: description || null,
        place_type: "on_the_go",
        service_area,
        phone: phone || null,
        email: email || null,
        website: website || null,
        instagram: instagram || null,
        facebook: facebook || null,
        cover_image_url: cover_image_url || null,
        source: "user",
        created_by: user.id,
        is_active_today: false,
        current_address: "Business offline",
      })
      .select()
      .single();

    if (createError) {
      console.error("Create place error:", createError);
      return new Response(
        JSON.stringify({ error: "Failed to create business" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Your On The Go business has been created. Open its owner controls to manage details and live availability.",
        place: {
          id: newPlace.id,
          name: newPlace.name,
          tavvy_category: newPlace.tavvy_category,
          service_area: newPlace.service_area,
          place_type: newPlace.place_type,
          is_active_today: newPlace.is_active_today,
        },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Create On The Go place error:", error);
    return new Response(
      JSON.stringify({ error: onTheGoError(error)===500 ? "Internal server error" : (error as Error).message }),
      { status: onTheGoError(error), headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
