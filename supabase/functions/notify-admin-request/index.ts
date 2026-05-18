const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const webhookUrl = Deno.env.get("ADMIN_NOTIFICATION_WEBHOOK_URL");
  const webhookSecret = Deno.env.get("ADMIN_NOTIFICATION_WEBHOOK_SECRET");

  if (!webhookUrl || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Admin notification webhook is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const userId = body.userId ?? "unknown";
  const userName = body.userName ?? "unknown";
  const reason = body.reason ?? "";

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      secret: webhookSecret,
      userId,
      userName,
      reason,
      subject: "[WINE TOGETHER] Admin 권한 신청",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(JSON.stringify({ error: errorText }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
