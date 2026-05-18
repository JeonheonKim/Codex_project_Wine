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

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const toEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") ?? "kimkjh0645@naver.com";
  const fromEmail = Deno.env.get("ADMIN_NOTIFICATION_FROM") ?? "WINE TOGETHER <onboarding@resend.dev>";

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const userId = body.userId ?? "unknown";
  const userName = body.userName ?? "unknown";
  const reason = body.reason ?? "";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: `[WINE TOGETHER] Admin 권한 신청`,
      text: [
        "새 Admin 권한 신청이 접수되었습니다.",
        "",
        `신청자 ID: ${userId}`,
        `신청자 이름: ${userName}`,
        `신청 사유: ${reason}`,
        "",
        "WINE TOGETHER Master 계정으로 접속해 승인 여부를 확인해주세요.",
      ].join("\n"),
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
