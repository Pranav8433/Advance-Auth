export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOtpHtml(otp) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your OTP Code</title>
<style>
  body {
    margin: 0;
    padding: 0;
    background-color: #f4f4f7;
    font-family: Arial, sans-serif;
  }
  .container {
    width: 100%;
    padding: 20px;
    background-color: #f4f4f7;
  }
  .email-box {
    max-width: 500px;
    margin: auto;
    background: #ffffff;
    border-radius: 10px;
    padding: 30px;
    text-align: center;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  }
  .logo {
    font-size: 22px;
    font-weight: bold;
    color: #4CAF50;
    margin-bottom: 20px;
  }
  .title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
    color: #333;
  }
  .text {
    font-size: 14px;
    color: #555;
    margin-bottom: 25px;
  }
  .otp {
    display: inline-block;
    font-size: 28px;
    letter-spacing: 6px;
    font-weight: bold;
    color: #ffffff;
    background: #4CAF50;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 25px;
  }
  .footer {
    font-size: 12px;
    color: #999;
    margin-top: 20px;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="email-box">
      <div class="logo">Advance_Auth</div>
      <div class="title">Verify Your Email</div>
      <div class="text">
        Use the OTP below to complete your verification. This code is valid for 5 minutes.
      </div>
      <div class="otp">${otp}</div>
      <div class="text">
        If you didn’t request this, you can safely ignore this email.
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} YourApp. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>`;
}