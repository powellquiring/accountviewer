# Firebase Studio

This is a NextJS starter in Firebase Studio. It was initially created by the gemini AI.

To get started, take a look at src/app/page.tsx.

## Working locally

Working in studio.firebase.google.com is the easiest way to work.  However, it is possible to work locally.

Front end:
```
npm install
npm run dev
```

See below for running the function.

Deploying local changes.  First enable an environment that is similar to studio (I hope)

```
firebase experiments:enable webframeworks
```

Then deploy the function and hosting
```
firebase deploy
```




## Sheets API Access
Make a service account in gcloud.  Do not add any permissions it does not need to access resources in the gcloud project. It will produce an email address that can be used in sheets.

In the gcloud account create a service account.
- In the context of a project select APIs & Services and select Credentials. 
- Click + Create credenntials from the drop down and select Service Account
- Add the account name "sheets-access"
- Description: email address that will be used in sheets - allow read/write/create access
- Create and continue
- Continue - no permissions needed
- Principles and access (optional) nothing needed - click Done 

Note the email address.

In the Service accounts list choose sheets-access
- Click keys
- click Add Key > Create new key > JSON
- Click on the 3 dots and select Manage keys
- Add Key > Create new key > JSON
- Json file will be downloaded

The contents of the json file is stored in the secrets manager

```
< sheets-access-123456-123f58bc2123.json tr '\n' ' ' | pbcopy
firebase functions:secrets:set SHEETS
<paste the json here>
```

## Share a google sheet with the service account email
Create a google sheet in your sheets account.  Share it with the service account email.  The sheet id is in the functions/src/index.ts file. 

```
const SPREADSHEET_ID = '1hRzwZC6Sn7g3ZGYgna6503_jGuEfvCm2C5rchi4Vny8'
```

## Debugging function

It is possible to run a function locally and debug it using the vscode debugger.

Put the contents of the secret into the functions/.secret.local.  Format is SHEETS='<json here>'

```
firebase functions:secrets:access SHEETS > functions/.secret.local
vim functions/.secret.local
<add the SHEETS='stuff in file and the trailing '>
 ```

 The final file looks something like:
 ```
 cat functions/.secret.local
 SHEETS='{   "type": "service_account",   "project_id": "projectid",   "private_key_id": "abcdef12",   "private_key": "-----BEGIN PRIVATE KEY-----\nabcdefABCDEF123\nabcdeeee\nw==\n-----END PRIVATE KEY-----\n",   "client_email": "abcdef@projectid.iam.gserviceaccount.com",   "client_id": "12345",   "auth_uri": "https://accounts.google.com/o/oauth2/auth",   "token_uri": "https://oauth2.googleapis.com/token",   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",   "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/abcde%40projectid.iam.gserviceaccount.com",   "universe_domain": "googleapis.com" } '
```

Run the emulators with inspect functions.  Check the port
```
firebase emulators:start --inspect-functions
```

Take note of the debug port - in my case 9230.  Then attach in the vscode debugger.

```
 {
      "type": "node",
      "request": "attach",
      "name": "attach and debug on port 9230",
      "port": 9230
    }
```

## Deploying function

```
firebase deploy --only functions
```

## tsx
Etrade: Select Portfolios, Account: All brokerage accounts, click Download button
Fidelity: Open All Accounts, Positions tab, click elipses - Download
Robinhood: Copy paste create csv

The tsx directory contains a tool to generate a json file from downloaded accounts csv files. It supports Etrade, Fidelity, and Robinhood .  It is a node app that can be run with tsx.

```
cd tsx
npx tsx tool.ts
```