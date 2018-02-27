/**
 * Manages the user postings. GIG Postings made by the logged user.
 *
 * IMPORTANT: Using DUMMY DATA rather than connected to the REST API for now
 */
import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageIndexedListDataProviderDriver from './helpers/LocalForageIndexedListDataProviderDriver';
import LocalForageItemDataProviderDriver from './helpers/LocalForageItemDataProviderDriver';
//import RestItemDataProviderDriver from './helpers/RestItemDataProviderDriver';
//import RestSingleDataProviderDriver from './helpers/RestSingleDataProviderDriver';
import localforage from './drivers/localforage';
//import rest from './drivers/restClient';

//const API_NAME = 'searchSubCategorySolutions';
const LOCAL_KEY = 'searchSubCategorySolutions';
const ID_PROPERTY_NAME = 'userPostingID';

const localListDriver = new LocalForageIndexedListDataProviderDriver(localforage, LOCAL_KEY, ID_PROPERTY_NAME);

/// DUMMY DATA
// Note: more data can be added, keeping the IDs consecutive
const DUMMY_DATA_LIST = [{
    searchSubCategoryID: 2,
    solutionID: 9,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 2,
    solutionID: 10,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 2,
    solutionID: 15,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 2,
    solutionID: 41,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 2,
    solutionID: 44,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 2,
    solutionID: 108,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 2,
    solutionID: 129,
    displayRank: 700,
  },
  {
    searchSubCategoryID: 2,
    solutionID: 136,
    displayRank: 650,
  },
  {
    searchSubCategoryID: 2,
    solutionID: 161,
    displayRank: 600,
  },
  {
    searchSubCategoryID: 2,
    solutionID: 169,
    displayRank: 550,
  },
  {
    searchSubCategoryID: 2,
    solutionID: 172,
    displayRank: 500,
  },
  {
    searchSubCategoryID: 2,
    solutionID: 122,
    displayRank: 475,
  },
  {
    searchSubCategoryID: 2,
    solutionID: 178,
    displayRank: 450,
  },
  {
    searchSubCategoryID: 2,
    solutionID: 193,
    displayRank: 400,
  },
  {
    searchSubCategoryID: 2,
    solutionID: 240,
    displayRank: 350,
  },
  {
    searchSubCategoryID: 2,
    solutionID: 281,
    displayRank: 300,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 6,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 13,
    displayRank: 990,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 14,
    displayRank: 980,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 20,
    displayRank: 970,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 25,
    displayRank: 960,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 28,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 29,
    displayRank: 940,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 38,
    displayRank: 930,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 49,
    displayRank: 920,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 50,
    displayRank: 910,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 51,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 75,
    displayRank: 890,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 77,
    displayRank: 880,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 78,
    displayRank: 870,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 81,
    displayRank: 860,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 83,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 84,
    displayRank: 840,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 97,
    displayRank: 830,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 99,
    displayRank: 820,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 101,
    displayRank: 810,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 105,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 111,
    displayRank: 790,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 112,
    displayRank: 780,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 113,
    displayRank: 770,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 115,
    displayRank: 760,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 120,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 124,
    displayRank: 740,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 127,
    displayRank: 730,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 132,
    displayRank: 720,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 133,
    displayRank: 710,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 135,
    displayRank: 700,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 141,
    displayRank: 690,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 142,
    displayRank: 680,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 144,
    displayRank: 670,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 146,
    displayRank: 660,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 152,
    displayRank: 650,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 159,
    displayRank: 640,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 170,
    displayRank: 630,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 173,
    displayRank: 620,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 175,
    displayRank: 610,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 188,
    displayRank: 600,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 189,
    displayRank: 590,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 191,
    displayRank: 580,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 192,
    displayRank: 570,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 203,
    displayRank: 560,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 205,
    displayRank: 550,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 208,
    displayRank: 540,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 209,
    displayRank: 530,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 210,
    displayRank: 520,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 211,
    displayRank: 510,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 215,
    displayRank: 500,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 216,
    displayRank: 490,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 217,
    displayRank: 480,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 221,
    displayRank: 470,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 225,
    displayRank: 460,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 226,
    displayRank: 450,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 227,
    displayRank: 440,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 236,
    displayRank: 430,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 238,
    displayRank: 420,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 239,
    displayRank: 410,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 247,
    displayRank: 400,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 248,
    displayRank: 390,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 249,
    displayRank: 380,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 250,
    displayRank: 370,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 251,
    displayRank: 360,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 275,
    displayRank: 350,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 276,
    displayRank: 340,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 279,
    displayRank: 330,
  },
  {
    searchSubCategoryID: 3,
    solutionID: 280,
    displayRank: 320,
  },
  {
    searchSubCategoryID: 4,
    solutionID: 19,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 4,
    solutionID: 23,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 5,
    solutionID: 37,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 5,
    solutionID: 48,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 5,
    solutionID: 121,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 5,
    solutionID: 219,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 5,
    solutionID: 277,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 6,
    solutionID: 4,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 6,
    solutionID: 26,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 6,
    solutionID: 52,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 6,
    solutionID: 58,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 6,
    solutionID: 96,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 6,
    solutionID: 229,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 6,
    solutionID: 278,
    displayRank: 700,
  },
  {
    searchSubCategoryID: 8,
    solutionID: 5,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 8,
    solutionID: 7,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 8,
    solutionID: 27,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 8,
    solutionID: 42,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 8,
    solutionID: 45,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 8,
    solutionID: 118,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 8,
    solutionID: 119,
    displayRank: 700,
  },
  {
    searchSubCategoryID: 8,
    solutionID: 147,
    displayRank: 650,
  },
  {
    searchSubCategoryID: 8,
    solutionID: 149,
    displayRank: 600,
  },
  {
    searchSubCategoryID: 8,
    solutionID: 153,
    displayRank: 550,
  },
  {
    searchSubCategoryID: 8,
    solutionID: 168,
    displayRank: 500,
  },
  {
    searchSubCategoryID: 8,
    solutionID: 177,
    displayRank: 450,
  },
  {
    searchSubCategoryID: 8,
    solutionID: 187,
    displayRank: 400,
  },
  {
    searchSubCategoryID: 8,
    solutionID: 218,
    displayRank: 350,
  },
  {
    searchSubCategoryID: 8,
    solutionID: 223,
    displayRank: 300,
  },
  {
    searchSubCategoryID: 8,
    solutionID: 282,
    displayRank: 250,
  },
  {
    searchSubCategoryID: 9,
    solutionID: 32,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 9,
    solutionID: 134,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 9,
    solutionID: 139,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 9,
    solutionID: 154,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 9,
    solutionID: 165,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 9,
    solutionID: 199,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 9,
    solutionID: 212,
    displayRank: 700,
  },
  {
    searchSubCategoryID: 9,
    solutionID: 233,
    displayRank: 650,
  },
  {
    searchSubCategoryID: 10,
    solutionID: 16,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 10,
    solutionID: 157,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 10,
    solutionID: 158,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 10,
    solutionID: 204,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 10,
    solutionID: 228,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 12,
    solutionID: 4,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 12,
    solutionID: 26,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 12,
    solutionID: 58,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 12,
    solutionID: 96,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 12,
    solutionID: 229,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 12,
    solutionID: 278,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 14,
    solutionID: 56,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 14,
    solutionID: 89,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 14,
    solutionID: 186,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 15,
    solutionID: 21,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 15,
    solutionID: 65,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 15,
    solutionID: 76,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 15,
    solutionID: 80,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 15,
    solutionID: 160,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 15,
    solutionID: 164,
    displayRank: 700,
  },
  {
    searchSubCategoryID: 15,
    solutionID: 166,
    displayRank: 650,
  },
  {
    searchSubCategoryID: 16,
    solutionID: 12,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 16,
    solutionID: 18,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 16,
    solutionID: 90,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 16,
    solutionID: 100,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 16,
    solutionID: 134,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 16,
    solutionID: 154,
    displayRank: 700,
  },
  {
    searchSubCategoryID: 16,
    solutionID: 165,
    displayRank: 600,
  },
  {
    searchSubCategoryID: 16,
    solutionID: 206,
    displayRank: 500,
  },
  {
    searchSubCategoryID: 16,
    solutionID: 212,
    displayRank: 450,
  },
  {
    searchSubCategoryID: 16,
    solutionID: 222,
    displayRank: 350,
  },
  {
    searchSubCategoryID: 16,
    solutionID: 233,
    displayRank: 300,
  },
  {
    searchSubCategoryID: 17,
    solutionID: 4,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 17,
    solutionID: 26,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 17,
    solutionID: 229,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 17,
    solutionID: 278,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 19,
    solutionID: 33,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 19,
    solutionID: 34,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 19,
    solutionID: 35,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 19,
    solutionID: 181,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 19,
    solutionID: 242,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 20,
    solutionID: 70,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 20,
    solutionID: 71,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 20,
    solutionID: 72,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 20,
    solutionID: 73,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 20,
    solutionID: 74,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 20,
    solutionID: 181,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 21,
    solutionID: 179,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 21,
    solutionID: 180,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 21,
    solutionID: 181,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 21,
    solutionID: 182,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 21,
    solutionID: 183,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 23,
    solutionID: 55,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 23,
    solutionID: 128,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 23,
    solutionID: 174,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 24,
    solutionID: 67,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 24,
    solutionID: 79,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 24,
    solutionID: 109,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 24,
    solutionID: 162,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 24,
    solutionID: 196,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 24,
    solutionID: 197,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 24,
    solutionID: 234,
    displayRank: 700,
  },
  {
    searchSubCategoryID: 24,
    solutionID: 241,
    displayRank: 650,
  },
  {
    searchSubCategoryID: 24,
    solutionID: 252,
    displayRank: 600,
  },
  {
    searchSubCategoryID: 24,
    solutionID: 255,
    displayRank: 550,
  },
  {
    searchSubCategoryID: 25,
    solutionID: 62,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 25,
    solutionID: 64,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 25,
    solutionID: 88,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 25,
    solutionID: 126,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 25,
    solutionID: 167,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 26,
    solutionID: 2,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 26,
    solutionID: 60,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 26,
    solutionID: 61,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 26,
    solutionID: 63,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 26,
    solutionID: 145,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 26,
    solutionID: 201,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 27,
    solutionID: 8,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 27,
    solutionID: 17,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 27,
    solutionID: 117,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 27,
    solutionID: 125,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 27,
    solutionID: 143,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 27,
    solutionID: 185,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 27,
    solutionID: 186,
    displayRank: 700,
  },
  {
    searchSubCategoryID: 27,
    solutionID: 194,
    displayRank: 650,
  },
  {
    searchSubCategoryID: 27,
    solutionID: 243,
    displayRank: 600,
  },
  {
    searchSubCategoryID: 27,
    solutionID: 245,
    displayRank: 550,
  },
  {
    searchSubCategoryID: 27,
    solutionID: 254,
    displayRank: 500,
  },
  {
    searchSubCategoryID: 28,
    solutionID: 3,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 28,
    solutionID: 24,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 28,
    solutionID: 54,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 28,
    solutionID: 57,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 28,
    solutionID: 114,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 28,
    solutionID: 116,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 28,
    solutionID: 138,
    displayRank: 700,
  },
  {
    searchSubCategoryID: 28,
    solutionID: 156,
    displayRank: 650,
  },
  {
    searchSubCategoryID: 28,
    solutionID: 198,
    displayRank: 600,
  },
  {
    searchSubCategoryID: 28,
    solutionID: 207,
    displayRank: 550,
  },
  {
    searchSubCategoryID: 28,
    solutionID: 230,
    displayRank: 500,
  },
  {
    searchSubCategoryID: 28,
    solutionID: 231,
    displayRank: 450,
  },
  {
    searchSubCategoryID: 28,
    solutionID: 253,
    displayRank: 400,
  },
  {
    searchSubCategoryID: 29,
    solutionID: 1,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 29,
    solutionID: 11,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 29,
    solutionID: 39,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 29,
    solutionID: 43,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 29,
    solutionID: 53,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 29,
    solutionID: 82,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 29,
    solutionID: 129,
    displayRank: 700,
  },
  {
    searchSubCategoryID: 29,
    solutionID: 155,
    displayRank: 650,
  },
  {
    searchSubCategoryID: 29,
    solutionID: 195,
    displayRank: 600,
  },
  {
    searchSubCategoryID: 30,
    solutionID: 31,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 30,
    solutionID: 68,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 30,
    solutionID: 137,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 30,
    solutionID: 150,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 30,
    solutionID: 151,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 30,
    solutionID: 200,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 30,
    solutionID: 213,
    displayRank: 700,
  },
  {
    searchSubCategoryID: 30,
    solutionID: 214,
    displayRank: 650,
  },
  {
    searchSubCategoryID: 30,
    solutionID: 220,
    displayRank: 600,
  },
  {
    searchSubCategoryID: 30,
    solutionID: 232,
    displayRank: 550,
  },
  {
    searchSubCategoryID: 30,
    solutionID: 235,
    displayRank: 500,
  },
  {
    searchSubCategoryID: 31,
    solutionID: 4,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 31,
    solutionID: 59,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 31,
    solutionID: 98,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 31,
    solutionID: 123,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 31,
    solutionID: 148,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 31,
    solutionID: 176,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 31,
    solutionID: 197,
    displayRank: 700,
  },
  {
    searchSubCategoryID: 31,
    solutionID: 202,
    displayRank: 650,
  },
  {
    searchSubCategoryID: 31,
    solutionID: 224,
    displayRank: 600,
  },
  {
    searchSubCategoryID: 31,
    solutionID: 237,
    displayRank: 550,
  },
  {
    searchSubCategoryID: 31,
    solutionID: 256,
    displayRank: 500,
  },
  {
    searchSubCategoryID: 32,
    solutionID: 86,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 32,
    solutionID: 103,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 32,
    solutionID: 106,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 32,
    solutionID: 190,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 34,
    solutionID: 22,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 34,
    solutionID: 30,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 34,
    solutionID: 36,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 34,
    solutionID: 104,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 34,
    solutionID: 246,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 35,
    solutionID: 40,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 35,
    solutionID: 46,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 35,
    solutionID: 47,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 35,
    solutionID: 69,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 35,
    solutionID: 110,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 35,
    solutionID: 130,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 35,
    solutionID: 131,
    displayRank: 700,
  },
  {
    searchSubCategoryID: 35,
    solutionID: 140,
    displayRank: 650,
  },
  {
    searchSubCategoryID: 35,
    solutionID: 163,
    displayRank: 600,
  },
  {
    searchSubCategoryID: 35,
    solutionID: 171,
    displayRank: 550,
  },
  {
    searchSubCategoryID: 35,
    solutionID: 184,
    displayRank: 500,
  },
  {
    searchSubCategoryID: 36,
    solutionID: 66,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 36,
    solutionID: 87,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 36,
    solutionID: 91,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 36,
    solutionID: 92,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 36,
    solutionID: 93,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 36,
    solutionID: 94,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 36,
    solutionID: 95,
    displayRank: 700,
  },
  {
    searchSubCategoryID: 36,
    solutionID: 102,
    displayRank: 650,
  },
  {
    searchSubCategoryID: 36,
    solutionID: 186,
    displayRank: 600,
  },
  {
    searchSubCategoryID: 36,
    solutionID: 244,
    displayRank: 550,
  },
  {
    searchSubCategoryID: 37,
    solutionID: 85,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 37,
    solutionID: 107,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 37,
    solutionID: 257,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 258,
    displayRank: 1000,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 259,
    displayRank: 950,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 260,
    displayRank: 900,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 261,
    displayRank: 850,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 262,
    displayRank: 800,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 263,
    displayRank: 750,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 264,
    displayRank: 700,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 265,
    displayRank: 650,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 266,
    displayRank: 600,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 267,
    displayRank: 550,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 268,
    displayRank: 500,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 269,
    displayRank: 450,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 270,
    displayRank: 400,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 271,
    displayRank: 350,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 272,
    displayRank: 300,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 273,
    displayRank: 250,
  },
  {
    searchSubCategoryID: 38,
    solutionID: 274,
    displayRank: 200,
  }];
// Dummy driver for the whole list
const remoteListDriver = {
    fetch: () =>  Promise.resolve(DUMMY_DATA_LIST),
    /* The whole list cannot be replaced, only item by item */
    push: (/*data*/) => Promise.resolve(),
    /* The whole list cannot be removed, only item by item */
    delete: () => Promise.resolve()
};
// Dummy driver for items by id
const remoteItemDriver = (id) => ({
    fetch: () => {
        if (DUMMY_DATA_LIST.length < id) {
            return Promise.resolve(DUMMY_DATA_LIST[id - 1]);
        }
        else {
            return Promise.reject('Not Found');
        }
    },
    push: (data) => {
        if (DUMMY_DATA_LIST.length < id) {
            DUMMY_DATA_LIST[id - 1] = data;
            return Promise.resolve(DUMMY_DATA_LIST[id - 1]);
        }
        else {
            return Promise.reject('Not Found');
        }
    },
    delete: () => {
        if (DUMMY_DATA_LIST.length < id) {
            const deletedCopy = DUMMY_DATA_LIST[id - 1];
            DUMMY_DATA_LIST.splice(id - 1, 1);
            return Promise.resolve(deletedCopy);
        }
        else {
            return Promise.reject('Not Found');
        }
    }
});

/// Public API

/**
 * Provides access to the list of all external listings.
 * @returns {CachedDataProvider<Array<rest/UserExternalListing>>}
 * Usage:
 * - list.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - list.onLoadError.subscribe(fn) to get notified of errors happening as of onData
 */
export const list = new CachedDataProvider({
    // 1 minute
    ttl: 1 * 60 * 1000,
    remote: remoteListDriver,
    local: localListDriver
});

/**
 * Provides access to an API to fetch a specific record.
 * @param {number} id The userExternalListingID
 * @returns {CachedDataProvider<rest/UserExternalListing>}
 * Usage:
 * - item(platformID).onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - item(platformID).onLoadError.subscribe(fn) to get notified of errors happening as of onData
 */
export function item(id) {
    const localItemDriver = new LocalForageItemDataProviderDriver(localforage, LOCAL_KEY, id, ID_PROPERTY_NAME);
    const itemProvider = new CachedDataProvider({
        // 1 minutes
        ttl: 1 * 60 * 1000,
        remote: remoteItemDriver(id),
        local: localItemDriver
    });
    // List is dirty once an item is updated on cache directly. We can not
    // update the list correctly because of the list order or elements limits
    const invalidateList = list.invalidateCache.bind(list);
    itemProvider.onRemoteLoaded.subscribe(invalidateList);
    itemProvider.onDeleted.subscribe(invalidateList);
    itemProvider.onSaved.subscribe(invalidateList);

    /* **Same problem as in userExternalListings**
     In theory, if an updated load of the list happens in the meantime with
        an item() in use, we must notify the item of that new data.
        It's very strange for this to happens because of use cases, but in theory can happens.
        Next commented code can do that, BUT it will leak memory if we don't
        add an explicit disposal of the subscription when 'itemProvider' is
        not used anymore. With subscriptions in previous lines don't happens
        because are done to the own instance, while this subscription is done on the list
        and inside it holds a reference to 'itemProvider', preventing it from GC'ed.

    list.onRemoteLoaded.subscribe((list) => {
        const found = list.some((item) => {
            if (item[ID_PROPERTY_NAME] === id) {
                itemProvider.onLoaded.emit(item);
                return true;
            }
        });
        // If not found in updated list, means was deleted in the middle, notify
        // (actual deletion of local data happens already as part of the list
        // synching process, before of this).
        if (!found) {
            itemProvider.onDeleted.emit();
        }
    });
    */
    // Return the instance
    return itemProvider;
}
