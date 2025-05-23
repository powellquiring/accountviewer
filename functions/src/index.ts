/**
 * Firebase Cloud Functions
 */

import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

export const getMarketValues = onCall((request) => {
   try {
    const { symbols, times: timeStrings } = request.data;
    
    if (!symbols || !Array.isArray(symbols)) {
      throw new Error("M222issing required 'symbols' array in request data");
    }

    // Parse times into Date objects if provided, otherwise use current time
    let times: Date[] = [];
    if (timeStrings && Array.isArray(timeStrings)) {
      times = timeStrings.map(time => new Date(time));
    } else {
      times = [new Date()];
    }

    logger.info("Fetching market values", {
      symbols,
      times,
      structuredData: true
    });

    // Restructured response format
    return times.map(time => ({
      time: time.toISOString(),
      values: symbols.map(symbol => ({
        symbol,
        price: Math.random() * 1000 // Mock price
      }))
    }));
  } catch (error) {
    logger.error("Error processing request", {error, structuredData: true});
    throw new Error("Internal server error");
  }
});
