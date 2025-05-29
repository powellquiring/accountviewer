# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

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
cat sheets-access-123456-123f58bc2123.json | tr '\n' ' ' | pbcopy
< sheets-access-123456-123f58bc2123.json tr '\n' ' ' | pbcopy
firebase functions:secrets:set SHEETS
<paste the json here>
```

Put the contents of the secret into the functions/.secret.local.  Format is SHEETS='<json here>'

```
firebase functions:secrets:access SHEETS > functions/.secret.local
vim functions/.secret.local
<add the SHEETS=' and the trailing '>
 ```

 ## Share a google sheet with the service account email
Create a google sheet in your sheets account.  Share it with the service account email.  The sheet id is in the functions/src/index.ts file. 

```
const SPREADSHEET_ID = '1hRzwZC6Sn7g3ZGYgna6503_jGuEfvCm2C5rchi4Vny8'
```

 ## Debugging function

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
The tsx directory contains a tool to generate a json file from downloaded accounts csv files. It supports Etrade, Fidelity, and Robinhood .  It is a node app that can be run with tsx.

```
cd tsx
npx tsx tool.ts
```