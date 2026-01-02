// 1. Go to https://script.google.com/home
// 2. Click "New Project"
// 3. Paste this code into the editor (replace existing code)
// 4. Click "Deploy" > "New Deployment"
// 5. Select type: "Web App"
//    - Description: "Zoho to Sheets Proxy"
//    - Execute as: "Me" (your account)
//    - Who has access: "Anyone" (IMPORTANT)
// 6. Click "Deploy" and copy the "Web App URL" (it ends in /exec)
// 7. Update your Form Action:
//    Replace 'https://oklf-zgp4.maillist-manage.in/weboptin.zc' 
//    with your new Web App URL in the HTML form action attribute.

function doPost(e) {
  // CONFIGURATION
  // Your Google Sheet ID from the URL provided
  var SHEET_ID = '1API0uiQksH7qt4giCNSWJaKmOA3bD-mA2mjEyeW1Q4o'; 
  var SHEET_NAME = 'Sheet1'; 
  
  // The original Zoho Action URL
  var ZOHO_URL = 'https://oklf-zgp4.maillist-manage.in/weboptin.zc';

  // --- LOGIC ---
  
  // 1. Parse incoming parameters from the form submission
  var params = e.parameter;
  
  // 2. Extract specific fields for the sheet
  var timestamp = new Date();
  var email = params.CONTACT_EMAIL || '';
  var name = params.LASTNAME || '';
  
  // Attempt to identify source (defaults to 'Direct' if not found)
  // Note: Referer is hard to capture reliably in GAS context without client-side help,
  // so we prioritize a hidden field 'utm_source' or 'source' if it exists.
  var source = params.utm_source || params.source || 'Direct';

  // 3. Log to Google Sheet
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    
    // If sheet not found by name, default to the first one
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }
    
    // Append the row: | Timestamp | Email | Name | Source |
    sheet.appendRow([timestamp, email, name, source]);
    
  } catch (err) {
    // Log error to Stackdriver Logging but DO NOT fail the user's subscription
    console.error('GOOGLE SHEET ERROR: ' + err.toString());
  }

  // 4. Forward the Data to Zoho
  // We reconstruct the payload to pass through exactly what the form sent
  // This ensures hidden fields like 'zc_formIx', 'cmpZuid' etc are preserved.
  var payload = {};
  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      payload[key] = params[key];
    }
  }

  var options = {
    'method': 'post',
    'payload': payload,
    'followRedirects': true,
    'muteHttpExceptions': true
  };

  try {
    var response = UrlFetchApp.fetch(ZOHO_URL, options);
    var responseHtml = response.getContentText();
    
    // 5. Return Zoho's Success Response to the Browser
    // This makes the transition seamless for the user
    return HtmlService.createHtmlOutput(responseHtml);
    
  } catch (err) {
    return HtmlService.createHtmlOutput("<h3>Subscription Successful (Proxy)</h3><p>We've recorded your details, but there was an issue connecting to the main list provider.</p>");
  }
}

// Function to handle GET requests simply to verify the script is running
function doGet(e) {
  return HtmlService.createHtmlOutput("Zoho-Sheet Proxy is Active. Please use POST method.");
}
