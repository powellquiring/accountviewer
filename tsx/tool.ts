import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import { parse } from 'csv-parse/sync'
import yahooFinance from 'yahoo-finance2';

// Suppress yahoo-finance2 info messages only
yahooFinance.setGlobalConfig({
  logger: {
    info: () => {},
    debug: () => {},
    warn: (...args: any[]) => console.error(...args),
    error: (...args: any[]) => console.error(...args),
  },
});


dotenv.config()

interface Security {
  symbol: string
  description: string
  quantity: number
  cost: number
  stock: boolean
}
interface Accounts {
  listId: string
  securities: Account[]
  timestamp: string
  source: string
}

interface Account {
  name: string
  value: number
  cash: number
  securities: Security[]
}

interface ParseResult {
  accounts: Account[]
  success: boolean
}

interface FidelityRecord {
  [key: string]: string | number | boolean
  stock: boolean
  [ACCOUNT_NAME]: string
  [SYMBOL]: string
  [QUANTITY]: string | number
  [COST]: string
  [DESCRIPTION]: string
  'Current Value': string
}

const ACCOUNT_NAME = 'Account Name'
const SYMBOL = 'Symbol'
const QUANTITY = 'Quantity'
const COST = 'Average Cost Basis'
const DESCRIPTION = 'Description'

// Base directory for securities data
function getSecuritiesBaseDir(): string {
  return process.env.SECURITIES_BASE_DIR || '/Users/powellquiring/track'
}

async function stockDescription(name:string): Promise<string> {
  if (name === 'BRK.B') {
    name = 'BRK-B'
  }
  try {
    const quote = await yahooFinance.quote(name)
    return quote.longName ? quote.longName : name
  } catch (error) {
    // console.error(`Error fetching description for ${name}:`, error)
    return name
  }
}

function parseEtradeAllAccounts(content: string): ParseResult {
  // Parse CSV content
  const rows = content.split('\n')
  const error: ParseResult = { accounts: [], success: false }

  if (rows.length < 16) {
    return error
  }
  if (rows[0].trim() != 'Account Summary') {
    return error
  }

  // parse the two lines that summarize the account
  const ACCOUNT_NAME = 'Account'
  const ACCOUNT_VALUE = 'Total Assets'
  const GAIN = 'Total Unrealized Gain $'
  const totalHeading = rows[1]
  for (const columnHead of [ACCOUNT_NAME, ACCOUNT_VALUE, GAIN]) {
    if (!totalHeading.includes(columnHead)) {
      return error
    }
  }
  const accountTable = rows.slice(1, 3).join('\n')
  const accountRecords = parse(accountTable, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })
  const accountValue = accountRecords[0][ACCOUNT_VALUE]
  const accountName = accountRecords[0][ACCOUNT_NAME]

  const QTY = 'Quantity'
  const SYMBOL = 'Symbol'
  const COST = 'Price Paid $'

  const heading = rows[10]
  for (const columnHead of [SYMBOL, QTY, COST]) {
    if (!heading.includes(columnHead)) {
      return error
    }
  }

  let row_number_last = 0
  let accountCash = 0
  for (let row_number = 11; row_number < rows.length; row_number++) {
    const row_contents = rows[row_number]
    row_number_last = row_number
    if (row_contents.includes('CASH')) {
      const cashRow = row_contents.split(',')
      accountCash = Number(cashRow[9])
      break
    }
  }

  const table = rows.slice(10, row_number_last).join('\n')
  const records = parse(table, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  // Transform records to match securities format
  const securities = records.map((record: any) => ({
    symbol: record[SYMBOL],
    quantity: Number(record[QTY] || 0),
    cost: Number(record[COST] || 0),
    stock: record[SYMBOL] !== 'VSGAX',
  }))

  return {
    accounts: [
      {
        name: accountName,
        value: accountValue,
        cash: accountCash,
        securities: securities,
      },
    ],
    success: true,
  }
}
function parseEtradeContent(content: string): ParseResult {
  // Parse CSV content
  const rows = content.split('\n')
  const error: ParseResult = { accounts: [], success: false }

  if (rows.length < 16) {
    return error
  }
  if (rows[0].trim() != 'Account Summary') {
    return error
  }

  // parse the two lines that summarize the account
  const ACCOUNT_NAME = 'Account'
  const ACCOUNT_VALUE = 'Net Account Value'
  const CASH = 'Cash Purchasing Power'
  const totalHeading = rows[1]
  if (totalHeading.includes(ACCOUNT_NAME)) {
    const accountDescription = rows[2]
    if (accountDescription.includes("All brokerage accounts")) {
      return parseEtradeAllAccounts(content)
    }
    return error
  }
  for (const columnHead of [ACCOUNT_NAME, ACCOUNT_VALUE, CASH]) {
    if (!totalHeading.includes(columnHead)) {
      return error
    }
  }
  const accountTable = rows.slice(1, 3).join('\n')
  const accountRecords = parse(accountTable, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })
  const accountValue = accountRecords[0][ACCOUNT_VALUE]
  const accountCash = accountRecords[0][CASH]
  const accountName = accountRecords[0][ACCOUNT_NAME]

  const QTY = 'Qty #'
  const SYMBOL = 'Symbol'
  const COST = 'Price Paid $'

  const heading = rows[10]
  for (const columnHead of [SYMBOL, QTY, COST]) {
    if (!heading.includes(columnHead)) {
      return error
    }
  }

  let row_number_last = 0
  for (let row_number = 11; row_number < rows.length; row_number++) {
    const row_contents = rows[row_number]
    row_number_last = row_number
    if (row_contents.includes('CASH')) {
      break
    }
  }

  const table = rows.slice(10, row_number_last).join('\n')
  const records = parse(table, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  // Transform records to match securities format
  const securities = records.map((record: any) => ({
    symbol: record[SYMBOL],
    quantity: Number(record[QTY] || 0),
    cost: Number(record[COST] || 0),
    stock: record[SYMBOL] !== 'VSGAX',
  }))

  return {
    accounts: [
      {
        name: accountName,
        value: accountValue,
        cash: accountCash,
        securities: securities,
      },
    ],
    success: true,
  }
}

function parseFidelityContent(content: string): ParseResult {
  function fidelityCorrectRecords(records: FidelityRecord[]): void {
    records.forEach((record) => {
      record.stock = true
      if (record[SYMBOL] === 'BRKB') {
        record[SYMBOL] = 'BRK.B'
      }
      if (record[DESCRIPTION].includes('UNITED STATES TREAS')) {
        record[SYMBOL] = 'TBILL'
        record.stock = false
      }
      if (record[ACCOUNT_NAME].includes('401(K)')) {
        record.stock = false
      }
    })
  }

  const rows = content.split('\n')
  const error: ParseResult = { accounts: [], success: false }

  if (rows.length < 5) {
    return error
  }

  const heading = rows[0]
  for (const columnHead of [ACCOUNT_NAME, SYMBOL, QUANTITY, COST]) {
    if (!heading.includes(columnHead)) {
      return error
    }
  }

  let row_number_last = 0
  for (let row_number = 1; row_number < rows.length; row_number++) {
    const row_contents = rows[row_number]
    row_number_last = row_number
    if (row_contents.trim() == '') {
      break
    }
  }

  if (row_number_last == rows.length - 1) {
    return error
  }

  const table = rows.slice(0, row_number_last).join('\n')
  const records = parse(table, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as FidelityRecord[]

  fidelityCorrectRecords(records)

  // Group records by account name
  const accountGroups: Record<string, FidelityRecord[]> = {}
  records.forEach((record) => {
    const accountName = record[ACCOUNT_NAME]
    if (!accountGroups[accountName]) {
      accountGroups[accountName] = []
    }
    accountGroups[accountName].push(record)
  })

  const ret: Account[] = []
  Object.entries(accountGroups).forEach(([accountName, records]) => {
    const name = accountName
    const value = 0
    let cash = 0
    const securities: Security[] = []
    const SPAXX = 'SPAXX**'
    const CORE = 'CORE**'
    for (const record of records) {
      if (record[SYMBOL] === SPAXX || record[SYMBOL] === CORE) {
        cash = Number(record['Current Value'].substring(1) || 0)
      } else if (record[SYMBOL] === 'Pending Activity') {
        // skip
      } else {
        securities.push({
          symbol: record[SYMBOL],
          quantity: Number(record[QUANTITY] || 0),
          cost: Number(record[COST].substring(1) || 0),
          stock: record.stock,
        })
      }
    }
    ret.push({
      name: name,
      value: value,
      cash: cash,
      securities: securities,
    })
  })

  return { accounts: ret, success: true }
}

function parseRobinhoodContent(content: string): ParseResult {
  // account heading
  const ACCOUNT_NAME = 'Account Name'
  const ACCOUNT_VALUE = 'Account Value'
  const ACCOUNT_CASH = 'Account Cash'

  const rows = content.split('\n')
  const error: ParseResult = { accounts: [], success: false }

  if (rows.length < 5) {
    return error
  }
  const accoutHeading = rows[0]
  for (const columnHead of [ACCOUNT_NAME, ACCOUNT_VALUE, ACCOUNT_CASH]) {
    if (!accoutHeading.includes(columnHead)) {
      return error
    }
  }
  const accountTable = rows.slice(0, 2).join('\n')
  const accountRecords = parse(accountTable, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })
  const accountName = accountRecords[0][ACCOUNT_NAME]
  const accountValue = accountRecords[0][ACCOUNT_VALUE]
  const accountCash = accountRecords[0][ACCOUNT_CASH]

  // account securities
  const SYMBOL = 'Symbol'
  const QUANTITY = 'Shares'
  const COST = 'Average cost'
  const heading = rows[3]
  for (const columnHead of [SYMBOL, QUANTITY, COST]) {
    if (!heading.includes(columnHead)) {
      return error
    }
  }

  const table = rows.slice(3, rows.length).join('\n')
  const records = parse(table, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  // Transform records to match securities format
  const securities = records.map((record: any) => ({
    symbol: record[SYMBOL],
    quantity: Number(record[QUANTITY] || 0),
    cost: Number(record[COST].slice(1) || 0),
    stock: true,
  }))

  return {
    accounts: [
      {
        name: accountName,
        value: accountValue,
        cash: accountCash,
        securities: securities,
      },
    ],
    success: true,
  }
}

function parseContent(content: string): ParseResult {
  const rows = content.split('\n')
  if (rows.length < 2) {
    return { accounts: [], success: false }
  }

  if (rows[0].includes('Account Summary')) {
    return parseEtradeContent(content)
  } else if (rows[0].includes('Account Name')) {
    if (rows[0].includes('Account Value')) {
      return parseRobinhoodContent(content)
    } else {
      return parseFidelityContent(content)
    }
  }

  return { accounts: [], success: false }
}

async function loadAccountsFromCSV(listId: string): Promise<Account[]> {
  const baseDir = getSecuritiesBaseDir()
  // const listDir = path.join(baseDir, 'securities', listId)
  const listDir = path.join(baseDir, listId)
  const files = await fs.readdir(listDir)
  const csvFiles = files.filter((file) => file.endsWith('.csv'))

  const accounts: Account[] = []
  for (const file of csvFiles) {
    const content = await fs.readFile(path.join(listDir, file), 'utf-8')
    const result = parseContent(content)
    if (result.success) {
      accounts.push(...result.accounts)
    }
  }

  return accounts
}

export async function getSecuritiesByListId(listId: string): Promise<Accounts> {
  try {
    const accounts = await loadAccountsFromCSV(listId)
    if (accounts.length === 0) {
      throw new Error(`No securities found for list ID: ${listId}`)
    }
    return {
      listId: listId,
      securities: accounts,
      timestamp: new Date().toISOString(),
      source: 'CSV Files',
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load securities: ${error.message}`)
    }
    throw error
  }
}

interface SecuritiesLists {
  lists: string[]
  count: number
  timestamp: string
}

export async function getSecuritiesLists(): Promise<SecuritiesLists> {
  let ret
  // Get directory list IDs from the filesystem
  try {
    const dirs = await fs.readdir(getSecuritiesBaseDir(), { withFileTypes: true })
    const dirListIds = dirs.filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name)
    ret = {
      lists: dirListIds,
      count: dirListIds.length,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error reading securities directories:', error)
    throw new Error(`Error reading securities directories ${error}`)
  }
  return ret
}

interface PrintSecurity {
  description: string
  quantity: number
  symbol: string
  stock: boolean
  unitcost: number
}
interface PrintAccount {
  id: string
  name: string
  securities: PrintSecurity[]
}
interface Print {
  accounts: PrintAccount[]
}
const ret: Print = {accounts: []}
// const securitiesLists = await getSecuritiesLists()
//const lists = securitiesLists.lists
const lists = ["watchlist"]
for (let i = 0; i < lists.length; i++) {
  const listId = lists[i]
  const securities = await getSecuritiesByListId(listId)
  for (const account of securities.securities) {
    const printSecurities: PrintSecurity[] = []
    for (const security of account.securities) {
      const description:string = await stockDescription(security.symbol)
      printSecurities.push({
        description: description,
        quantity: security.quantity,
        symbol: security.symbol,
        unitcost: security.cost,
        stock: security.stock,
      })
    }
    ret.accounts.push({
      id: account.name,
      name: account.name,
      securities: printSecurities
    })
  }
}
console.log(JSON.stringify(ret, null, 2))
