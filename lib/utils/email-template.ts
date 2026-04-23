export function emailTemplate(content: string, buttonText: string, buttonUrl: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mymatsh.com'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f4f0f2;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:2px solid #f0e8ee;">
              <span style="font-size:24px;font-weight:700;color:#7A1533;letter-spacing:-0.5px;">MyMatSH</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 20px;font-size:15px;line-height:1.6;color:#333333;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <a href="${buttonUrl}"
                 style="display:inline-block;padding:13px 30px;background:#7A1533;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
                ${buttonText}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f0e8ee;">
              <p style="margin:0;font-size:12px;color:#888888;line-height:1.5;">
                You are receiving this because you have an account on MyMatSH.
                Log in at <a href="${appUrl}" style="color:#7A1533;text-decoration:none;">${appUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
