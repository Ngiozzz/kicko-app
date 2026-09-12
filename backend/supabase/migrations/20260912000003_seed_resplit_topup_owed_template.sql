-- Adds the 18th email template: resplit_topup_owed, sent to already-
-- paid Open Session participants when the organizer resplits and their
-- share goes up (see resplitSession in sessions.controller.ts). Re-runs
-- the same upsert over all 18 rows from docs/email templates/*.html —
-- harmless no-op for the 17 already seeded, since content is unchanged.
insert into public.email_templates (key, subject, html, use_wrapper)
values
  ('booking_cancelled', 'Booking cancelled', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Booking cancelled</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    Your booking has been cancelled — here's what happens next. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(196,69,63,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#C4453F;">&#9679;&nbsp; Cancelled</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      This booking's off.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      Your booking at <strong style="color:#1E2126;">{{venueName}}</strong> has been cancelled. Nothing further is needed on your end.
                    </p>
                  </td>
                </tr>

                <!-- Refund block -->
                <tr>
                  <td class="kicko-pad" style="padding: 24px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 22px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 6px;">VENUE</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; color:#1E2126; padding-bottom: 14px;">{{venueName}}</td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px; padding-bottom: 14px;">
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 6px;">REFUND STATUS</div>
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color:#1E2126; line-height: 1.5;">{{refundLine}}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px;">
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">ORGANIZED BY</div>
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color:#1E2126;">{{organizerName}}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{browseUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Find another slot</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{browseUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            Find another slot
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      Questions about a refund? Reach out and we'll sort it out.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('booking_confirmed', 'Booking confirmed', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Booking confirmed</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  a.kicko-btn { transition: none; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-stack { display: block !important; width: 100% !important; }
    .kicko-h1 { font-size: 22px !important; }
    .kicko-amount { font-size: 26px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    Your booking is locked in — here's everything you need for game day. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(60,122,92,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#3C7A5C;">&#9679;&nbsp; Confirmed</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      You're all set, {{name}}.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      Your spot at <strong style="color:#1E2126;">{{venueName}}</strong> is locked in and paid for. Show this email or your booking QR at the gate.
                    </p>
                  </td>
                </tr>

                <!-- Details block -->
                <tr>
                  <td class="kicko-pad" style="padding: 24px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 22px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">VENUE</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; color:#1E2126; padding-bottom: 14px;">{{venueName}}</td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td class="kicko-stack" style="font-family: Arial, Helvetica, sans-serif; vertical-align: top; width: 60%;">
                                      <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">WHEN</div>
                                      <div style="font-size: 15px; font-weight: 600; color:#1E2126;">{{when}}</div>
                                    </td>
                                    <td class="kicko-stack" style="font-family: Arial, Helvetica, sans-serif; vertical-align: top; width: 40%; padding-top: 12px;">
                                      <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">AMOUNT PAID</div>
                                      <div class="kicko-amount" style="font-size: 20px; font-weight: 700; color:#1E2126;">{{amount}}</div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px;">
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">ORGANIZED BY</div>
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color:#1E2126;">{{organizerName}}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{bookingUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">View my booking</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a class="kicko-btn" href="{{bookingUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            View my booking
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      Need to change plans? You can cancel or reschedule from your bookings page up to the venue's cutoff time.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('fixture_scheduled', 'Your match has been scheduled', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Your match has been scheduled</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
    .kicko-vs-name { font-size: 15px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    {{teamName}} vs {{opponentName}} — kickoff time is set. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(192,138,62,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#C08A3E;">&#128197;&nbsp; Fixture scheduled</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      Your match is set.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      {{tournamentName}} has scheduled your next fixture. Details below.
                    </p>
                  </td>
                </tr>

                <!-- Matchup block -->
                <tr>
                  <td class="kicko-pad" style="padding: 24px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td style="padding: 22px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td align="center" style="padding-bottom: 16px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td class="kicko-vs-name" align="right" style="font-family: Arial, Helvetica, sans-serif; font-size: 17px; font-weight: 700; color:#1E2126; padding-right: 14px;">{{teamName}}</td>
                                    <td style="font-family: Georgia, 'Times New Roman', serif; font-size: 15px; font-weight: 700; color:#C08A3E; padding: 0 4px;">vs</td>
                                    <td class="kicko-vs-name" align="left" style="font-family: Arial, Helvetica, sans-serif; font-size: 17px; font-weight: 700; color:#1E2126; padding-left: 14px;">{{opponentName}}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 16px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td class="kicko-stack" style="font-family: Arial, Helvetica, sans-serif; vertical-align: top; width: 55%;">
                                      <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">VENUE</div>
                                      <div style="font-size: 15px; font-weight: 600; color:#1E2126;">{{venueName}}</div>
                                    </td>
                                    <td class="kicko-stack" style="font-family: Arial, Helvetica, sans-serif; vertical-align: top; width: 45%; padding-top: 12px;">
                                      <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">KICKOFF</div>
                                      <div style="font-size: 15px; font-weight: 600; color:#1E2126;">{{when}}</div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px;">
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">TOURNAMENT</div>
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color:#1E2126;">{{tournamentName}}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{fixtureUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">View fixture</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{fixtureUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            View fixture
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      Kickoff times can shift — you'll get another email if the organizer changes anything.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('game_reminder', 'Kickoff in about an hour', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Kickoff in about an hour</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    Kickoff is coming up — here's where to be and when. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(192,138,62,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#C08A3E;">&#9201;&nbsp; Kicks off in about an hour</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      Game time soon, {{name}}.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      You've got a booking coming up. Here's where to be.
                    </p>
                  </td>
                </tr>

                <!-- Details block -->
                <tr>
                  <td class="kicko-pad" style="padding: 24px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 22px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">VENUE</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; color:#1E2126; padding-bottom: 14px;">{{venueName}}</td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px; padding-bottom: 14px;">
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">KICKOFF</div>
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color:#1E2126;">{{when}}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px;">
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">ORGANIZED BY</div>
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color:#1E2126;">{{organizerName}}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{directionsUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Get directions</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{directionsUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            Get directions
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      Running late or need to cancel? Head to your bookings page before the cutoff.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('new_booking', 'New booking', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>New booking</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
    .kicko-amount { font-size: 26px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    Cha-ching — a new booking just came in at your venue. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                  <td style="padding-left:8px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color:#5A5F66; letter-spacing: 0.3px; vertical-align: middle;">for Owners</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(60,122,92,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#3C7A5C;">&#128176;&nbsp; New booking</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      You've got a booking.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      A slot at <strong style="color:#1E2126;">{{venueName}}</strong> was just booked and paid for.
                    </p>
                  </td>
                </tr>

                <!-- Details block -->
                <tr>
                  <td class="kicko-pad" style="padding: 24px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 22px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">VENUE</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; color:#1E2126; padding-bottom: 14px;">{{venueName}}</td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td class="kicko-stack" style="font-family: Arial, Helvetica, sans-serif; vertical-align: top; width: 60%;">
                                      <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">WHEN</div>
                                      <div style="font-size: 15px; font-weight: 600; color:#1E2126;">{{when}}</div>
                                    </td>
                                    <td class="kicko-stack" style="font-family: Arial, Helvetica, sans-serif; vertical-align: top; width: 40%; padding-top: 12px;">
                                      <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">AMOUNT</div>
                                      <div class="kicko-amount" style="font-size: 20px; font-weight: 700; color:#1E2126;">{{amount}}</div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{dashboardUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">View in dashboard</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{dashboardUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            View in dashboard
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      Payouts are processed automatically to your M-Pesa account on your usual payout schedule.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('new_review', 'New review', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>New review</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    A player just left a review for your venue. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                  <td style="padding-left:8px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color:#5A5F66; letter-spacing: 0.3px; vertical-align: middle;">for Owners</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(192,138,62,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#C08A3E;">&#9733;&nbsp; New review</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      You've got a new review.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      A player just reviewed <strong style="color:#1E2126;">{{venueName}}</strong>.
                    </p>
                  </td>
                </tr>

                <!-- Review block -->
                <tr>
                  <td class="kicko-pad" style="padding: 24px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td style="padding: 22px;">
                          <!-- Star rating, filled count driven by {{stars}} (1-5) -->
                          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 22px; letter-spacing: 2px; color:#C08A3E; padding-bottom: 12px;">{{starsDisplay}}</div>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid rgba(30,33,38,0.17);">
                            <tr>
                              <td style="padding-top: 14px; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; font-style: italic; color:#1E2126; line-height: 1.6;">
                                &ldquo;{{commentBlock}}&rdquo;
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{reviewUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">View &amp; respond</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{reviewUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            View &amp; respond
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      Responding to reviews builds trust with future players — it's shown publicly on your venue's page.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('payout_details_missing', 'We can''t pay you out yet', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>We can't pay you out yet</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
    .kicko-amount { font-size: 32px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    We're holding funds for you — add your payout details to release them. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                  <td style="padding-left:8px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color:#5A5F66; letter-spacing: 0.3px; vertical-align: middle;">for Owners</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(192,138,62,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#C08A3E;">&#9888;&nbsp; Action needed</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      We can't pay you out yet.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      You've got earnings waiting from <strong style="color:#1E2126;">{{venueName}}</strong>, but we don't have payout details on file yet. Add your M-Pesa number or bank account to release your funds.
                    </p>
                  </td>
                </tr>

                <!-- Amount block -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td align="center" style="padding: 26px 22px;">
                          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 8px;">WAITING TO BE PAID OUT</div>
                          <div class="kicko-amount" style="font-family: Georgia, 'Times New Roman', serif; font-size: 36px; font-weight: 700; color:#1E2126;">{{amount}}</div>
                          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color:#5A5F66; padding-top: 8px;">{{venueName}}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{payoutSettingsUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Add payout details</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{payoutSettingsUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            Add payout details
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      Your funds are safe and waiting — we'll pay out automatically as soon as your M-Pesa number or bank details are added.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('payout_failed', 'Payout failed', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Payout failed</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
    .kicko-amount { font-size: 32px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    Your payout didn't go through — here's why, and how to fix it. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                  <td style="padding-left:8px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color:#5A5F66; letter-spacing: 0.3px; vertical-align: middle;">for Owners</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(196,69,63,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#C4453F;">&#9679;&nbsp; Payout failed</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      Your payout didn't go through.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      We tried to send your payout for <strong style="color:#1E2126;">{{venueName}}</strong>, but the transfer to your M-Pesa or bank account failed. Your funds are safe and will be retried once this is resolved.
                    </p>
                  </td>
                </tr>

                <!-- Amount + reason block -->
                <tr>
                  <td class="kicko-pad" style="padding: 24px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 22px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">AMOUNT</td>
                            </tr>
                            <tr>
                              <td class="kicko-amount" style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 700; color:#1E2126; padding-bottom: 14px;">{{amount}}</td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px;">
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#C4453F; padding-bottom: 4px;">WHAT WENT WRONG</div>
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color:#1E2126; line-height: 1.5;">{{reason}}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{payoutSettingsUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Fix payout details</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{payoutSettingsUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            Fix payout details
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      We'll automatically retry the transfer once your details are updated. Contact support if you keep seeing this.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('payout_paid', 'Payout sent', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Payout sent</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
    .kicko-amount { font-size: 32px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    Your M-Pesa payout has landed. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                  <td style="padding-left:8px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color:#5A5F66; letter-spacing: 0.3px; vertical-align: middle;">for Owners</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(60,122,92,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#3C7A5C;">&#9679;&nbsp; Payout sent</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      Money's on its way.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      Your payout for <strong style="color:#1E2126;">{{venueName}}</strong> has been sent to your M-Pesa account.
                    </p>
                  </td>
                </tr>

                <!-- Amount block -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td align="center" style="padding: 26px 22px;">
                          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 8px;">AMOUNT PAID OUT</div>
                          <div class="kicko-amount" style="font-family: Georgia, 'Times New Roman', serif; font-size: 36px; font-weight: 700; color:#1E2126;">{{amount}}</div>
                          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color:#5A5F66; padding-top: 8px;">{{venueName}}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{payoutHistoryUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">View payout history</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{payoutHistoryUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            View payout history
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      M-Pesa transfers usually land within minutes; bank transfers can take 1–2 business days. Contact support if it's taking longer than expected.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('resplit_topup_owed', 'Your share has changed', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Your share has changed</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
    .kicko-amount { font-size: 26px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    Some players dropped out, so your share has gone up — here's your new total. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(192,138,62,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#C08A3E;">&#9888;&nbsp; Your share changed</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      Hi {{name}}, your share just went up.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      Some players in your session at <strong style="color:#1E2126;">{{venueName}}</strong> didn't confirm in time, so the cost has been split across a smaller group. You've already paid your original share — here's what's left to cover the difference.
                    </p>
                  </td>
                </tr>

                <!-- Amount block -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td align="center" style="padding: 24px 22px;">
                          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 8px;">TOP-UP OWED</div>
                          <div class="kicko-amount" style="font-family: Georgia, 'Times New Roman', serif; font-size: 30px; font-weight: 700; color:#1E2126;">{{topUpAmount}}</div>
                          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color:#5A5F66; padding-top: 8px;">{{venueName}} &middot; {{when}}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{topUpUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Pay top-up</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{topUpUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            Pay top-up
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      Nothing is charged automatically — you'll need to confirm and approve this top-up yourself. Your spot isn't guaranteed until it's paid.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('review_request', 'How was your game?', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>How was your game?</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
    .kicko-star { font-size: 30px !important; padding: 0 4px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    Got two minutes? Tell other players how it went. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(192,138,62,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#C08A3E;">&#9998;&nbsp; Quick favor</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      How was your game, {{name}}?
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      You played at <strong style="color:#1E2126;">{{venueName}}</strong> recently. A quick rating helps other players know what to expect — it takes under a minute.
                    </p>
                  </td>
                </tr>

                <!-- Star rating (clickable stars, all linking to reviewUrl with a prefilled rating param) -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px; width:100%;">
                      <tr>
                        <td align="center" style="padding: 24px 22px;">
                          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 14px;">TAP A RATING TO GET STARTED</div>
                          <div>
                            <a href="{{reviewUrl}}&rating=1" target="_blank" class="kicko-star" style="text-decoration:none; font-size: 34px; color:#C08A3E; padding: 0 6px;">&#9733;</a><!--
                            --><a href="{{reviewUrl}}&rating=2" target="_blank" class="kicko-star" style="text-decoration:none; font-size: 34px; color:#C08A3E; padding: 0 6px;">&#9733;</a><!--
                            --><a href="{{reviewUrl}}&rating=3" target="_blank" class="kicko-star" style="text-decoration:none; font-size: 34px; color:#C08A3E; padding: 0 6px;">&#9733;</a><!--
                            --><a href="{{reviewUrl}}&rating=4" target="_blank" class="kicko-star" style="text-decoration:none; font-size: 34px; color:#C08A3E; padding: 0 6px;">&#9733;</a><!--
                            --><a href="{{reviewUrl}}&rating=5" target="_blank" class="kicko-star" style="text-decoration:none; font-size: 34px; color:#C08A3E; padding: 0 6px;">&#9733;</a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 24px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{reviewUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Write a review</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{reviewUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            Write a review
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      Your review helps venue owners and future players — it's shown publicly on the venue's page.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('session_cancelled', 'Session cancelled', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Session cancelled</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    The open session you joined has been cancelled. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(196,69,63,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#C4453F;">&#9679;&nbsp; Session cancelled</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      This session's off.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      The Open Session you joined at <strong style="color:#1E2126;">{{venueName}}</strong> has been cancelled. Nothing further is needed on your end.
                    </p>
                  </td>
                </tr>

                <!-- Refund block -->
                <tr>
                  <td class="kicko-pad" style="padding: 24px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 22px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 6px;">VENUE</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; color:#1E2126; padding-bottom: 14px;">{{venueName}}</td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px;">
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 6px;">REFUND STATUS</div>
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color:#1E2126; line-height: 1.5;">{{refundLine}}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{browseUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Find another session</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{browseUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            Find another session
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      Questions about a refund? Reach out and we'll sort it out.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('split_booking_invite', 'You''ve been invited to split a booking', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>You've been invited to split a booking</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
    .kicko-amount { font-size: 26px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    {{inviterName}} wants you in on their booking — here's your share. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(192,138,62,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#C08A3E;">&#129309;&nbsp; Split booking invite</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      {{inviterName}} wants you in.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      <strong style="color:#1E2126;">{{inviterName}}</strong> has invited you to split a booking at <strong style="color:#1E2126;">{{venueName}}</strong>. Accept below to lock in your spot and pay your share.
                    </p>
                  </td>
                </tr>

                <!-- Details block -->
                <tr>
                  <td class="kicko-pad" style="padding: 24px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 22px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">VENUE</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; color:#1E2126; padding-bottom: 14px;">{{venueName}}</td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td class="kicko-stack" style="font-family: Arial, Helvetica, sans-serif; vertical-align: top; width: 60%;">
                                      <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">WHEN</div>
                                      <div style="font-size: 15px; font-weight: 600; color:#1E2126;">{{when}}</div>
                                    </td>
                                    <td class="kicko-stack" style="font-family: Arial, Helvetica, sans-serif; vertical-align: top; width: 40%; padding-top: 12px;">
                                      <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">YOUR SHARE</div>
                                      <div class="kicko-amount" style="font-size: 20px; font-weight: 700; color:#1E2126;">{{shareAmount}}</div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{acceptUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Accept &amp; pay my share</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{acceptUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            Accept &amp; pay my share
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Decline link -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 14px 36px 0 36px;">
                    <a href="{{declineUrl}}" target="_blank" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color:#5A5F66; text-decoration: underline;">Can't make it? Decline the invite</a>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      Your spot isn't held until you accept and pay your share — if it fills up, the invite may expire.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('team_invite', 'You''ve been invited to join a team', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>You've been invited to join a team</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    {{inviterName}} wants you on the roster — here's the team. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(192,138,62,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#C08A3E;">&#127942;&nbsp; Team invite</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      You've made the roster.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      <strong style="color:#1E2126;">{{inviterName}}</strong> has invited you to join <strong style="color:#1E2126;">{{teamName}}</strong>. Accept to be added to the team and see upcoming fixtures.
                    </p>
                  </td>
                </tr>

                <!-- Details block -->
                <tr>
                  <td class="kicko-pad" style="padding: 24px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 22px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">TEAM</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; color:#1E2126; padding-bottom: 14px;">{{teamName}}</td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px;">
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">SPORT</div>
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color:#1E2126;">{{sportLine}}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{acceptUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Accept invite</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{acceptUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            Accept invite
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Decline link -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 14px 36px 0 36px;">
                    <a href="{{declineUrl}}" target="_blank" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color:#5A5F66; text-decoration: underline;">Not interested? Decline the invite</a>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      Once you accept, {{inviterName}} and the rest of the team will be able to see you on the roster.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('tournament_withdrawal', 'A team has withdrawn', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>A team has withdrawn</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    A registered team has pulled out of your tournament. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                  <td style="padding-left:8px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color:#5A5F66; letter-spacing: 0.3px; vertical-align: middle;">for Organizers</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(196,69,63,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#C4453F;">&#9679;&nbsp; Team withdrawn</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      A team has dropped out.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      <strong style="color:#1E2126;">{{teamName}}</strong> has withdrawn from <strong style="color:#1E2126;">{{tournamentName}}</strong>. You may want to update the bracket or fill the open slot.
                    </p>
                  </td>
                </tr>

                <!-- Details block -->
                <tr>
                  <td class="kicko-pad" style="padding: 24px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 22px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">TEAM WITHDRAWN</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; color:#1E2126; padding-bottom: 14px;">{{teamName}}</td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px;">
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">TOURNAMENT</div>
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color:#1E2126;">{{tournamentName}}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{tournamentUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Manage tournament</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{tournamentUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            Manage tournament
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      Any entry fee refund to the withdrawing team is handled automatically per your tournament's refund policy.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('venue_submitted', 'New venue awaiting review', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>New venue awaiting review</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
    .kicko-stack { display: block !important; width: 100% !important; padding-left: 0 !important; padding-top: 12px !important; }
    .kicko-photo { width: 31% !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    A new venue needs your review before it goes live. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                  <td style="padding-left:8px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color:#5A5F66; letter-spacing: 0.3px; vertical-align: middle;">Admin</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(192,138,62,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#C08A3E;">&#128203;&nbsp; Awaiting review</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      New venue to review.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      <strong style="color:#1E2126;">{{venueName}}</strong> was submitted for listing and needs approval before it can accept bookings.
                    </p>
                  </td>
                </tr>

                <!-- Owner info -->
                <tr>
                  <td class="kicko-pad" style="padding: 24px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 22px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.4px; color:#C08A3E; padding-bottom: 12px;">SUBMITTED BY</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; color:#1E2126; padding-bottom: 14px;">{{ownerName}}</td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td class="kicko-stack" style="font-family: Arial, Helvetica, sans-serif; vertical-align: top; width: 50%;">
                                      <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">EMAIL</div>
                                      <div style="font-size: 15px; font-weight: 600; color:#1E2126;">{{ownerEmail}}</div>
                                    </td>
                                    <td class="kicko-stack" style="font-family: Arial, Helvetica, sans-serif; vertical-align: top; width: 50%; padding-left: 12px;">
                                      <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">PHONE</div>
                                      <div style="font-size: 15px; font-weight: 600; color:#1E2126;">{{ownerPhone}}</div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Listing basics -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 22px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.4px; color:#C08A3E; padding-bottom: 12px;">LISTING BASICS</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; color:#1E2126; padding-bottom: 2px;">{{venueName}}</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color:#5A5F66; padding-bottom: 14px;">{{location}} &middot; {{sport}}</td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px;">
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td class="kicko-stack" style="font-family: Arial, Helvetica, sans-serif; vertical-align: top; width: 50%;">
                                      <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">HOURS</div>
                                      <div style="font-size: 15px; font-weight: 600; color:#1E2126;">{{hoursLine}}</div>
                                    </td>
                                    <td class="kicko-stack" style="font-family: Arial, Helvetica, sans-serif; vertical-align: top; width: 50%; padding-left: 12px;">
                                      <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">PRICING</div>
                                      <div style="font-size: 15px; font-weight: 600; color:#1E2126;">{{pricingLine}}</div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px;">
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">SUBMITTED</div>
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color:#1E2126;">{{submittedAt}}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Photos -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 22px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.4px; color:#C08A3E; padding-bottom: 12px;">PHOTOS &middot; {{photoCount}}</td>
                            </tr>
                          </table>

                          <!-- Photo strip: shown when photoCount > 0. Delete this table and show the no-photos notice below when photoCount is 0. -->
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td class="kicko-photo" style="width:32%; padding-right: 2%;">
                                <img src="{{photoUrl1}}" width="100%" alt="Venue photo 1" style="display:block; border-radius: 8px; border:1px solid rgba(30,33,38,0.17);">
                              </td>
                              <td class="kicko-photo" style="width:32%; padding-right: 2%;">
                                <img src="{{photoUrl2}}" width="100%" alt="Venue photo 2" style="display:block; border-radius: 8px; border:1px solid rgba(30,33,38,0.17);">
                              </td>
                              <td class="kicko-photo" style="width:32%;">
                                <img src="{{photoUrl3}}" width="100%" alt="Venue photo 3" style="display:block; border-radius: 8px; border:1px solid rgba(30,33,38,0.17);">
                              </td>
                            </tr>
                          </table>
                          <!-- /photo strip -->

                          <!-- No-photos notice: use this block instead of the strip above when photoCount is 0 -->
                          <!--
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: rgba(196,69,63,0.14); border-radius: 8px;">
                            <tr>
                              <td style="padding: 12px 14px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#C4453F;">
                                &#9888;&nbsp; No photos were uploaded with this listing.
                              </td>
                            </tr>
                          </table>
                          -->

                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Amenities -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 22px;">
                          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.4px; color:#C08A3E; padding-bottom: 10px;">AMENITIES (AS ENTERED BY OWNER)</div>
                          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 500; color:#1E2126; line-height: 1.7;">{{amenitiesText}}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{reviewUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Review submission</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{reviewUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            Review submission
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      This venue won't appear in search or accept bookings until it's approved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Admin Notifications
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('venue_suspended', 'Venue suspended', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Venue suspended</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    Your venue has been suspended and is no longer accepting bookings. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                  <td style="padding-left:8px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color:#5A5F66; letter-spacing: 0.3px; vertical-align: middle;">for Owners</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Status strip -->
                <tr>
                  <td class="kicko-pad" style="padding: 28px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: rgba(196,69,63,0.14); border-radius: 100px; padding: 6px 14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color:#C4453F;">&#9679;&nbsp; Venue suspended</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td class="kicko-pad" style="padding: 16px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      Your venue has been suspended.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      <strong style="color:#1E2126;">{{venueName}}</strong> has been taken down and can no longer accept new bookings. Any existing bookings will be handled separately.
                    </p>
                  </td>
                </tr>

                <!-- Reason block -->
                <tr>
                  <td class="kicko-pad" style="padding: 24px 36px 0 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E0D7C8; border-radius: 12px;">
                      <tr>
                        <td style="padding: 20px 22px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#5A5F66; padding-bottom: 4px;">VENUE</td>
                            </tr>
                            <tr>
                              <td style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700; color:#1E2126; padding-bottom: 14px;">{{venueName}}</td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid rgba(30,33,38,0.17); padding-top: 14px;">
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.3px; color:#C4453F; padding-bottom: 4px;">REASON</div>
                                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color:#1E2126; line-height: 1.5;">{{reason}}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{appealUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Contact support</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{appealUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            Contact support
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      If you believe this was a mistake, you can appeal by contacting support with your venue details.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false),
  ('venue_verified', 'Venue verified', $tpl$<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Venue verified</title>
<!--[if mso]>
<noscript>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
</noscript>
<![endif]-->
<style>
  body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F7F4EF; }

  @media only screen and (max-width: 600px) {
    .kicko-container { width: 100% !important; }
    .kicko-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .kicko-h1 { font-size: 22px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#F7F4EF;">
  <!-- preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; color:#F7F4EF;">
    You're verified and live — players can now find and book your venue. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <table role="presentation" class="kicko-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td align="center" style="padding: 4px 0 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <img src="https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png" width="152" height="35" alt="Kicko" style="display:block; height:35px; width:152px;">
                  </td>
                  <td style="padding-left:8px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color:#5A5F66; letter-spacing: 0.3px; vertical-align: middle;">for Owners</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EAE3D7; border:1px solid rgba(30,33,38,0.17); border-radius:16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Verified badge, front and center -->
                <tr>
                  <td align="center" style="padding: 36px 36px 0 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:64px; height:64px; border-radius: 50%; background: linear-gradient(135deg, #D9A857, #C08A3E);">
                          <table role="presentation" width="64" height="64" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td align="center" valign="middle" style="font-family: Arial, Helvetica, sans-serif; font-size: 30px; color:#1E2126; line-height:1;">&#10003;</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td align="center" class="kicko-pad" style="padding: 18px 36px 4px 36px;">
                    <h1 class="kicko-h1" style="margin:0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; font-weight: 700; color:#1E2126;">
                      You're verified.
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" class="kicko-pad" style="padding: 8px 36px 0 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color:#5A5F66;">
                      <strong style="color:#1E2126;">{{venueName}}</strong> has passed review and is now live on Kicko. Players can find and book it starting now.
                    </p>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 28px 36px 8px 36px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #D9A857, #C08A3E);" bgcolor="#C08A3E">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{venuePageUrl}}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="20%" fillcolor="#C08A3E" strokecolor="#C08A3E">
                          <w:anchorlock/>
                          <center style="color:#1E2126;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">View your live listing</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="{{venuePageUrl}}" target="_blank" style="display:block; padding: 14px 36px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; color:#1E2126; text-decoration:none;">
                            View your live listing
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fine print -->
                <tr>
                  <td class="kicko-pad" align="center" style="padding: 20px 36px 32px 36px;">
                    <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.6; color:#5A5F66;">
                      Tip: venues with photos and a full schedule get booked faster. Update yours anytime from your dashboard.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 20px 12px 20px;">
              <p style="margin:0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                Kicko &middot; Multi-Sport Venue Booking &middot; Nairobi, Kenya
              </p>
              <p style="margin:0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color:#5A5F66;">
                <a href="{{manageNotificationsUrl}}" style="color:#5A5F66; text-decoration: underline;">Manage email preferences</a>
                &nbsp;&middot;&nbsp;
                <a href="{{supportUrl}}" style="color:#5A5F66; text-decoration: underline;">Contact support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$tpl$, false)
on conflict (key) do update set
  subject = excluded.subject,
  html = excluded.html,
  use_wrapper = excluded.use_wrapper,
  updated_at = now();
