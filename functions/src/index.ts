/**
 * Firebase Cloud Functions
 */

import {onCall} from "firebase-functions/v2/https";
import { google } from 'googleapis'
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions";

interface MarketPrices {
  prices: Record<string, number>
}

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
const SPREADSHEET_ID = '1hRzwZC6Sn7g3ZGYgna6503_jGuEfvCm2C5rchi4Vny8'
const MOCK_PRICE = -0.02

async function getSheetsId(credentials: any) {
  try {
    const auth = new google.auth.GoogleAuth( {
      credentials: credentials,
      scopes: SCOPES,
    })
    const sheets = google.sheets({ version: 'v4', auth: auth })
    return sheets
  } catch (error) {
    console.error("Error during authentication:", error)
    throw error
  }
}

let _sheets_id: any = null
async function getSheets(credentials: any) {
  if (_sheets_id) {
    return _sheets_id
  }
  try {
    const sheets = await getSheetsId(credentials)
    _sheets_id = sheets
    return sheets
  } catch (error) {
    console.error("Error during authentication to goole sheets:", error)
    throw error
  }
}

function numberToLetters(num: number): string {
  let letters = ''
  while (num >= 0) {
    letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[num % 26] + letters
    num = Math.floor(num / 26) - 1
  }
  return letters
}

/**
 * @param symbols - Array of stock symbols
 * @returns Object with symbol as key and price as value
 */
function getMockPrices(symbols: string[]): MarketPrices {
  const prices: Record<string, number> = {}

  symbols.forEach((symbol) => {
    prices[symbol] = MOCK_PRICE
  })

  return {
    prices,
  }
} 

/**
 * Get market prices for the given symbols using google sheets
 * @param symbols - Array of stock symbols
 * @returns Object with symbol as key and price as value
 */
async function getMarketPrices(credentials: any, symbols: string[]): Promise<MarketPrices> {
  try {
    const sheets = await getSheets(credentials)
    
    const sheet_range = `Sheet1!${numberToLetters(0)}1:${numberToLetters(symbols.length - 1)}2`
    const v = [symbols, symbols.map(s => `=GOOGLEFINANCE("${s}")`)]
    
    // Update the formulas
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: sheet_range,
      valueInputOption: 'USER_ENTERED',
      resource: { values: v }
    })

    // Wait a moment for the formulas to calculate
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Get the calculated values
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheet_range,
    })

    const prices: Record<string, number> = {}
    if (response.data.values && response.data.values[1]) {
      response.data.values[1].forEach((price: string, index: number) => {
        prices[symbols[index]] = parseFloat(price) || MOCK_PRICE
      })
    }

    return {
      prices,
    }
  } catch (error) {
    console.warn('Falling back to mock data due to API error:', error)
    return getMockPrices(symbols)
  }
}

const sheetsSecret = functions.params.defineSecret("SHEETS")
export const getMarketValues = onCall(
  { secrets: [sheetsSecret] }, // runWith options are passed here
  async (request) => {
   try {
    const { symbols, times: timeStrings } = request.data;
    console.log("before sheets");
    console.log("after sheets");
    console.log(JSON.stringify(JSON.parse(sheetsSecret.value())));
    const credentials = JSON.parse(sheetsSecret.value())
    
    if (!symbols || !Array.isArray(symbols)) {
      throw new Error("M222issing required 'symbols' array in request data");
    }

    // Parse times into Date objects in a future release
    if (timeStrings && !Array.isArray(timeStrings)) {
      throw new Error("Missing required 'times' array in request data");
    }
    if (timeStrings) {
      throw new Error("Times array not yet implemented");
    }

    logger.info("Fetching market values", {
      symbols,
      structuredData: true
    });

    const marketPrices = await getMarketPrices(credentials, symbols);
    const ret = [{
      time: new Date().toISOString(),
      values: marketPrices.prices,
    }]
    logger.info("Returning", { ret, structuredData: true})


    return ret
  } catch (error) {
    logger.error("Error processing request", {error, structuredData: true});
    throw new Error("Internal server error");
  }
});
