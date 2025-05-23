# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Sheets
In the gcloud account create a service ID that has permissions to edit sheets.  Download the associated json file. Store the sheets access in the secrets manager

```
cat retirement-459614-565f58bc2828.json | tr '\n' ' ' | pbcopy
firebase functions:secrets:set SHEETS
```