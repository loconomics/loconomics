/**
 * Acccess available solutions, by searchSubCategoryID or by solutionID.
 *
 * IMPORTANT: Using DUMMY DATA rather than connected to the REST API for now
 */
import CachedDataProvider from './helpers/CachedDataProvider';
import LocalForageItemDataProviderDriver from './helpers/LocalForageItemDataProviderDriver';
import LocalForageSingleDataProviderDriver from './helpers/LocalForageSingleDataProviderDriver';
//import RestItemDataProviderDriver from './helpers/RestItemDataProviderDriver';
import localforage from './drivers/localforage';
import rest from './drivers/restClient';

const API_NAME = 'solutions';
const LOCAL_KEY = 'solutions';
const ID_PROPERTY_NAME = 'solutionID';
const BY_SUB_CATEGORY_LOCAL_KEY = 'searchSubCategoriesSolutions';

/// DUMMY DATA
// Note: more data can be added, keeping the IDs consecutive
const DUMMY_DATA_SOLUTIONS = [
  {
    solutionID: 1,
    name: '3D Modeling & CAD',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 2,
    name: 'A/B Testing',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 3,
    name: 'Academic Writing & Research',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 4,
    name: 'Accounting',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 5,
    name: 'Acupuncture',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 6,
    name: 'Air and Water Balancing',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 7,
    name: 'Alternative Healing',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 8,
    name: 'Animation',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 9,
    name: 'Appliance Installation',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 10,
    name: 'Appliance Repair',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 11,
    name: 'Architecture',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 12,
    name: 'Arts and Craft Lessons',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 13,
    name: 'Asbestos',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 14,
    name: 'Asbestos Abatement',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 15,
    name: 'Assembly & Mounting',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 16,
    name: 'Astrology',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 17,
    name: 'Audio Production',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 18,
    name: 'Audio Production Lessons',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 19,
    name: 'Auto Maintanence',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 20,
    name: 'Awnings',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 21,
    name: 'Babysitting',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 1,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 22,
    name: 'Bartending',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 23,
    name: 'Bike Maintanence',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 24,
    name: 'Blog and Article Writing',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 25,
    name: 'Boiler, Hot Water Heating and Steam Fitting',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 26,
    name: 'Bookkeeping',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 27,
    name: 'Brows and Lashes',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 28,
    name: 'Building Moving/Demolition',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 29,
    name: 'Cabinet, Millwork and Finish Carpentry',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 30,
    name: 'Cake Making Services',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 31,
    name: 'Campaign Automation',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 32,
    name: 'Career Counseling',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 33,
    name: 'Cat Boarding',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 34,
    name: 'Cat Grooming',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 35,
    name: 'Cat Sitting',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 36,
    name: 'Catering',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 37,
    name: 'Cell Phones',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 38,
    name: 'Central Vacuum Systems',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 39,
    name: 'Chemical Engineering',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 40,
    name: 'Children\'s Entertainment',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 1,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 41,
    name: 'Chimney and Fireplace',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 42,
    name: 'Chiropractic',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 43,
    name: 'Civil and Structural Engineering',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 44,
    name: 'Cleaning',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 45,
    name: 'Clothing Alterations',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 46,
    name: 'Clowns',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 47,
    name: 'Comedians',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 48,
    name: 'Computer',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 49,
    name: 'Concrete',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 50,
    name: 'Construction Clean-up',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 51,
    name: 'Construction Zone Traffic Control',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 52,
    name: 'Contract Law',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 53,
    name: 'Contract Manufacturing',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 54,
    name: 'Copywriting',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 55,
    name: 'Corporate Law',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 56,
    name: 'Counseling',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 57,
    name: 'Creative Writing',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 58,
    name: 'Criminal Law',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 59,
    name: 'Data Entry',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 60,
    name: 'Data Extraction / ETL',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 61,
    name: 'Data Mining & Management',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 62,
    name: 'Data Recovery',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 63,
    name: 'Data Visualization',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 64,
    name: 'Database Administration',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 65,
    name: 'Day Care',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 1,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 66,
    name: 'Decorating',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 67,
    name: 'Desktop Application Development',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 68,
    name: 'Display Advertising',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 69,
    name: 'DJs',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 70,
    name: 'Dog Boarding',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 71,
    name: 'Dog Fence Installation',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 72,
    name: 'Dog Grooming',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 73,
    name: 'Dog Sitting',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 74,
    name: 'Dog Walking',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 75,
    name: 'Doors and Gates',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 76,
    name: 'Doula Care',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 77,
    name: 'Drywall',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 78,
    name: 'Earthwork and Paving',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 79,
    name: 'Ecommerce Development',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 80,
    name: 'Elder Care',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 1,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 81,
    name: 'Electrical',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 82,
    name: 'Electrical Engineering',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 83,
    name: 'Electronics and Appliances',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 84,
    name: 'Elevator',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 85,
    name: 'Emcee and Hosting',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 86,
    name: 'Entertainment',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 87,
    name: 'Equipment Rentals',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 88,
    name: 'ERP / CRM Software',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 89,
    name: 'Errands',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 90,
    name: 'ESL (English as a Second Language) Lessons',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 91,
    name: 'Event Bouncer Services',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 92,
    name: 'Event Help and Wait Staff',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 93,
    name: 'Event Planning',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 94,
    name: 'Event Security Services',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 95,
    name: 'Event Venue Services',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 96,
    name: 'Family Law',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 97,
    name: 'Fencing',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 98,
    name: 'Financial Planning',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 99,
    name: 'Fire Protection',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 100,
    name: 'First Aid Training',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 101,
    name: 'Flooring and Floor Covering',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 102,
    name: 'Floral Arrangement',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 103,
    name: 'Food and Drink',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 104,
    name: 'Food Truck',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 105,
    name: 'Framing and Rough Carpentry',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 106,
    name: 'Fundraising Event Planning',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 107,
    name: 'Funerals',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 108,
    name: 'Furniture Repair and Restoration',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 109,
    name: 'Game Development',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 110,
    name: 'Games',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 111,
    name: 'General Building',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 112,
    name: 'General Engineering',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 113,
    name: 'General Manufactured Housing',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 114,
    name: 'General Translation',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 115,
    name: 'Glazing (Glass and Windows)',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 116,
    name: 'Grant Writing',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 117,
    name: 'Graphic Design',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 118,
    name: 'Hair removal',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 119,
    name: 'Haircuts and coloring',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 120,
    name: 'Hazardous Substance Removal',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 121,
    name: 'Home Theater',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 122,
    name: 'House Sitting',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 1,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 123,
    name: 'Human Resources',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 124,
    name: 'Hydroseed Spraying',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 125,
    name: 'Illustration',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 126,
    name: 'Information Security',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 127,
    name: 'Insulation and Acoustics',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 128,
    name: 'Intellectual Property Law',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 129,
    name: 'Interior Design',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 130,
    name: 'Juggling',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 131,
    name: 'Karaoke Machine Rental',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 132,
    name: 'Landscape Architect',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 133,
    name: 'Landscaping',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 134,
    name: 'Language Tutoring',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 135,
    name: 'Lathing and Plastering',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 136,
    name: 'Laundry',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 137,
    name: 'Lead Generation',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 138,
    name: 'Legal Translation',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 139,
    name: 'Life Coaching',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 140,
    name: 'Live Music',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 141,
    name: 'Lock and Security Equipment',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 142,
    name: 'Locks and Safes',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 143,
    name: 'Logo Design and Branding',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 144,
    name: 'Low Voltage Systems',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 145,
    name: 'Machine Learning',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 146,
    name: 'Machinery and Pumps',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 147,
    name: 'Makeup',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 148,
    name: 'Management Consulting',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 149,
    name: 'Manicures and pedicures',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 150,
    name: 'Market Research',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 151,
    name: 'Marketing Strategy',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 152,
    name: 'Masonry',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 153,
    name: 'Massage Therapy',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 154,
    name: 'Math Tutoring',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 155,
    name: 'Mechanical Engineering',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 156,
    name: 'Medical Translation',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 157,
    name: 'Meditation',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 158,
    name: 'Mediums',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 159,
    name: 'Metal Products',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 160,
    name: 'Midwife Care',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 161,
    name: 'Minor Home Repair',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 162,
    name: 'Mobile Development',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 163,
    name: 'Mobile Petting Zoo',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 164,
    name: 'Mommy Helpers',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 1,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 165,
    name: 'Music Lessons',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 166,
    name: 'Nannies',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 1,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 167,
    name: 'Network and System Administration',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 168,
    name: 'Nutrition Coaching',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 169,
    name: 'Odd Jobs',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 170,
    name: 'Ornamental Metal',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 171,
    name: 'Other',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 172,
    name: 'Packing & Moving Assistance',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 173,
    name: 'Painting and Decorating',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 174,
    name: 'Paralegal Services',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 175,
    name: 'Parking and Highway Improvement',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 176,
    name: 'Personal Assistant',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 177,
    name: 'Personal Training',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 178,
    name: 'Pest Control',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 179,
    name: 'Pet Boarding',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 180,
    name: 'Pet Grooming',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 181,
    name: 'Pet Photography',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 182,
    name: 'Pet Sitting',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 183,
    name: 'Pet Walking',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 184,
    name: 'Photo Booth',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 185,
    name: 'Photo Editing',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 186,
    name: 'Photography',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 187,
    name: 'Pilates Instruction',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 188,
    name: 'Pile Driving and Pressure Foundation Jacking',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 189,
    name: 'Pipeline',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 190,
    name: 'Planning and Decorations',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 191,
    name: 'Plumbing',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 192,
    name: 'Poles',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 193,
    name: 'Pool and Spa Maintenance',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 194,
    name: 'Presentations',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 195,
    name: 'Product Design',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 196,
    name: 'Product Management',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 197,
    name: 'Project Management',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 198,
    name: 'Proofreading and Editing',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 199,
    name: 'Psychotherapy',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 200,
    name: 'Public Relations',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 201,
    name: 'Quantitative Analysis',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 202,
    name: 'Recruiting',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 203,
    name: 'Refrigeration',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 204,
    name: 'Reiki',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 205,
    name: 'Reinforcing Steel',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 206,
    name: 'Resumes & Cover Letters',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 207,
    name: 'Resumes and Cover Letters',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 208,
    name: 'Roofing',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 209,
    name: 'Sand and Water Blasting',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 210,
    name: 'Sanitation Systems',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 211,
    name: 'Scaffolding',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 212,
    name: 'Science Tutoring',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 213,
    name: 'Search Engine Marketing (SEM)',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 214,
    name: 'Search Engine Optimization (SEO)',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 215,
    name: 'Sheet Metal',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 216,
    name: 'Siding and Decking',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 217,
    name: 'Signs',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 218,
    name: 'Skin care',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 219,
    name: 'Smart Home',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 220,
    name: 'Social Media Marketing (SMM)',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 221,
    name: 'Solar',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 222,
    name: 'Sports Lessons',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 223,
    name: 'Sports Training',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 224,
    name: 'Strategy and Operations Consulting',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 225,
    name: 'Structural Steel',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 226,
    name: 'Suspended Ceilings',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 227,
    name: 'Swimming Pool',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 228,
    name: 'Tarot Readings',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 229,
    name: 'Tax Preparation',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 230,
    name: 'Technical Translation',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 231,
    name: 'Technical Writing',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 232,
    name: 'Telemarketing',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 233,
    name: 'Test Tutoring',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 234,
    name: 'Testing and QA',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 235,
    name: 'Text Message Marketing (TMM)',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 236,
    name: 'Tile',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 237,
    name: 'Transcription',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 238,
    name: 'Tree Service',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 239,
    name: 'Trenching',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 240,
    name: 'Upholstery Repair and Restoration',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 241,
    name: 'Utilities and Scripts',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 242,
    name: 'Veterinary Cat Care',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 243,
    name: 'Video Production',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 244,
    name: 'Videography',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 245,
    name: 'Voice Talent',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 246,
    name: 'Wait Staff',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 247,
    name: 'Wallpapering',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 248,
    name: 'Warm-Air Heating, Ventilating and Air-Conditioning',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 249,
    name: 'Water Conditioning',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 250,
    name: 'Waterproofing and Weatherproofing',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 251,
    name: 'Weatherization and Energy Conservation',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 252,
    name: 'Web and Mobile Design',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 253,
    name: 'Web Content',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 254,
    name: 'Web Design',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 255,
    name: 'Web Development',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 256,
    name: 'Web Research',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 257,
    name: 'Wedding',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 258,
    name: 'Wedding and Bridesmaid Dress Alterations',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 259,
    name: 'Wedding and Event Decorating',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 260,
    name: 'Wedding and Event Hair Styling',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 261,
    name: 'Wedding and Event Invitations',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 262,
    name: 'Wedding and Event Makeup',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 263,
    name: 'Wedding Cakes',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 264,
    name: 'Wedding Catering',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 265,
    name: 'Wedding Coordination',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 266,
    name: 'Wedding Dance Lessons',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 267,
    name: 'Wedding Florist',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 268,
    name: 'Wedding Henna Tattooing',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 269,
    name: 'Wedding Officiant',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 270,
    name: 'Wedding Photography',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 271,
    name: 'Wedding Planning',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 272,
    name: 'Wedding Ring Services',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 273,
    name: 'Wedding Venue Services',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 274,
    name: 'Wedding Videography',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 275,
    name: 'Welding',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 276,
    name: 'Well Drilling',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 277,
    name: 'Wifi and Networking',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 278,
    name: 'Wills and Trusts',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 279,
    name: 'Window Coverings',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 280,
    name: 'Wood Tanks',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 281,
    name: 'Yard work',
    credentialCheckRequired: 0,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  },
  {
    solutionID: 282,
    name: 'Yoga Instruction',
    credentialCheckRequired: 1,
    backgroundCheckRequired: 0,
    isHIPAA: 0,
    taxActivityID: null,
    postingTemplateID: null,
    image: '',
    active: 1
  }
];

const DUMMY_DATA_SEARCH_SUB_CATEGORY_SOLUTIONS = [{
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
  }
];

/// Indexed access to solutions (computed based on dummy data)
const SOLUTIONS_INDEX = (() => {
    var dict = {};
    DUMMY_DATA_SOLUTIONS.forEach((solution) => {
        dict[solution.solutionID] = solution;
    });
    return dict;
})();
/// Dictionary of solutions grouped subCategoryID
/// (computed based on dummy data)
const SOLUTIONS_BY_SUB_CATEGORY_DICTIONARY = (() => {
    const dict = {};
    DUMMY_DATA_SEARCH_SUB_CATEGORY_SOLUTIONS.forEach((record) => {
        let list = dict[record.searchSubCategoryID];
        if (!list) {
            list = dict[record.searchSubCategoryID] = [];
        }
        list.push(SOLUTIONS_INDEX[record.solutionID]);
    });
    return dict;
})();

// Dummy driver for data grouped by an id
const remoteGroupDriver = (id) => ({
  fetch: () => {
      if (SOLUTIONS_BY_SUB_CATEGORY_DICTIONARY.hasOwnProperty(id)) {
          return Promise.resolve(SOLUTIONS_BY_SUB_CATEGORY_DICTIONARY[id]);
      }
      else {
          return Promise.reject('Not Found');
      }
  },
  push: (data) => {
      if (SOLUTIONS_BY_SUB_CATEGORY_DICTIONARY.hasOwnProperty(id)) {
        SOLUTIONS_BY_SUB_CATEGORY_DICTIONARY[id] = data;
          return Promise.resolve(SOLUTIONS_BY_SUB_CATEGORY_DICTIONARY[id]);
      }
      else {
          return Promise.reject('Not Found');
      }
  },
  delete: () => {
      if (SOLUTIONS_BY_SUB_CATEGORY_DICTIONARY.hasOwnProperty(id)) {
          const deletedCopy = SOLUTIONS_BY_SUB_CATEGORY_DICTIONARY[id];
          delete SOLUTIONS_BY_SUB_CATEGORY_DICTIONARY[id];
          return Promise.resolve(deletedCopy);
      }
      else {
          return Promise.reject('Not Found');
      }
  }
});

// Dummy driver for individual indexed items
const remoteItemDriver = (id) => ({
  fetch: () => {
      if (SOLUTIONS_INDEX.hasOwnProperty(id)) {
          return Promise.resolve(SOLUTIONS_INDEX[id]);
      }
      else {
          return Promise.reject('Not Found');
      }
  },
  push: (data) => {
      if (SOLUTIONS_INDEX.hasOwnProperty(id)) {
        SOLUTIONS_INDEX[id] = data;
          return Promise.resolve(SOLUTIONS_INDEX[id]);
      }
      else {
          return Promise.reject('Not Found');
      }
  },
  delete: () => {
      if (SOLUTIONS_INDEX.hasOwnProperty(id)) {
          const deletedCopy = SOLUTIONS_INDEX[id];
          delete SOLUTIONS_INDEX[id];
          return Promise.resolve(deletedCopy);
      }
      else {
          return Promise.reject('Not Found');
      }
  }
});

/**
 * Provides an API to fetch all solutions under a searchSubCategoryID.
 * @param {number} id The searchCategoryID
 * @returns {CachedDataProvider<Array<rest/Solution>>}
 * Usage:
 * - const dataProvider = byCategoryID(searchCategoryID);
 * - dataProvider.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - dataProvider.onLoadError.subscribe(fn) to get notified of errors happening as of onData
 */
export function bySubCategoryID(id) {
  return new CachedDataProvider({
      // 1 minutes
      ttl: 1 * 60 * 1000,
      remote: remoteGroupDriver(id),
      local: new LocalForageSingleDataProviderDriver(localforage, BY_SUB_CATEGORY_LOCAL_KEY + '/' + id)
  });
}

/**
 * Provides access to an API to fetch a specific record.
 * @param {number} id The userExternalListingID
 * @returns {CachedDataProvider<rest/Solution>}
 * Usage:
 * - const dataProvider = byCategoryID(solutionID);
 * - dataProvider.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - dataProvider.onLoadError.subscribe(fn) to get notified of errors happening as of onData
 */
export function item(id) {
  return new CachedDataProvider({
      // 1 minutes
      ttl: 1 * 60 * 1000,
      remote: remoteItemDriver(id),
      local: new LocalForageItemDataProviderDriver(localforage, LOCAL_KEY, id, ID_PROPERTY_NAME)
  });
}

/**
 * Retrieves information for a job title search
 * @param {string} searchTerm job title search term to retrieve
 * @returns {Promise}
 */
export function solutionsAutocomplete(searchTerm) {
    return rest.get(API_NAME, { searchTerm });
}
