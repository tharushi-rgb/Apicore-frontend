export const PROVINCES = [
  'Central',
  'Eastern',
  'North Central',
  'Northern',
  'North Western',
  'Sabaragamuwa',
  'Southern',
  'Uva',
  'Western',
] as const;

export const DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  Central: ['Kandy', 'Matale', 'Nuwara Eliya'],
  Eastern: ['Ampara', 'Batticaloa', 'Trincomalee'],
  'North Central': ['Anuradhapura', 'Polonnaruwa'],
  Northern: ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
  'North Western': ['Kurunegala', 'Puttalam'],
  Sabaragamuwa: ['Kegalle', 'Ratnapura'],
  Southern: ['Galle', 'Hambantota', 'Matara'],
  Uva: ['Badulla', 'Monaragala'],
  Western: ['Colombo', 'Gampaha', 'Kalutara'],
};

export const DS_DIVISIONS_BY_DISTRICT: Record<string, string[]> = {
  Colombo: ['Colombo', 'Dehiwala', 'Homagama', 'Kaduwela', 'Kesbewa', 'Kolonnawa', 'Maharagama', 'Moratuwa', 'Padukka', 'Ratmalana', 'Seethawaka', 'Sri Jayawardenepura Kotte', 'Thimbirigasyaya'],
  Gampaha: ['Attanagalla', 'Biyagama', 'Divulapitiya', 'Dompe', 'Gampaha', 'Ja-Ela', 'Katana', 'Kelaniya', 'Mahara', 'Minuwangoda', 'Mirigama', 'Negombo', 'Wattala'],
  Kalutara: ['Agalawatta', 'Bandaragama', 'Beruwala', 'Bulathsinhala', 'Dodangoda', 'Horana', 'Ingiriya', 'Kalutara', 'Madurawela', 'Mathugama', 'Palindanuwara', 'Panadura', 'Walallavita'],
  Kandy: ['Akurana', 'Delthota', 'Doluwa', 'Ganga Ihala Korale', 'Harispattuwa', 'Hatharaliyadda', 'Kandy Four Gravets', 'Kundasale', 'Medadumbara', 'Minipe', 'Panavila', 'Pasbage Korale', 'Pathadumbara', 'Pathahewaheta', 'Poojapitiya', 'Pyagala', 'Udapalatha', 'Ududumbara', 'Udunuwara', 'Yatinuwara'],
  Matale: ['Ambanganga Korale', 'Dambulla', 'Galewela', 'Laggala-Pallegama', 'Madawala Ulpotha', 'Matale', 'Naula', 'Pallepola', 'Rattota', 'Ukuwela', 'Wilgamuwa'],
  'Nuwara Eliya': ['Ambagamuwa', 'Hanguranketha', 'Kothmale', 'Nuwara Eliya', 'Walapane'],
  Galle: ['Akmeemana', 'Ambalangoda', 'Baddegama', 'Balapitiya', 'Benthota', 'Bope-Poddala', 'Elpitiya', 'Galle', 'Gonapinuwala', 'Habaraduwa', 'Hikkaduwa', 'Imaduwa', 'Karandeniya', 'Nagoda', 'Neluwa', 'Niyagama', 'Thawalama', 'Welivitiya-Divithura'],
  Matara: ['Akuressa', 'Athuraliya', 'Devinuwara', 'Dickwella', 'Hakmana', 'Kamburupitiya', 'Kirinda Puhulwella', 'Kotapola', 'Malimbada', 'Matara Four Gravets', 'Mulatiyana', 'Pasgoda', 'Pitabeddara', 'Thihagoda', 'Weligama', 'Welipitiya'],
  Hambantota: ['Ambalantota', 'Angunakolapelessa', 'Beliatta', 'Hambantota', 'Katuwana', 'Lunugamvehera', 'Okewela', 'Sooriyawewa', 'Tangalle', 'Tissamaharama', 'Walasmulla', 'Weeraketiya'],
  Jaffna: ['Delft', 'Island North', 'Island South', 'Jaffna', 'Karainagar', 'Nallur', 'Thenmaradchi', 'Vadamaradchi East', 'Vadamaradchi North', 'Vadamaradchi South-West', 'Valikamam East', 'Valikamam North', 'Valikamam South', 'Valikamam South-West', 'Valikamam West'],
  Kilinochchi: ['Kandavalai', 'Karachchi', 'Pachchilaipalli', 'Poonakary'],
  Mannar: ['Madhu', 'Mannar', 'Nanattan', 'Musali', 'Mantal West'],
  Vavuniya: ['Vavuniya', 'Vavuniya North', 'Vavuniya South', 'Vengalacheddikulam'],
  Mullaitivu: ['Maritimepattu', 'Oddusuddan', 'Puthukudiyiruppu', 'Thunukkai', 'Welioya', 'Manthai East'],
  Batticaloa: ['Batticaloa', 'Eravur Pattu', 'Eravur Town', 'Kattankudy', 'Koralai Pattu', 'Koralai Pattu Central', 'Koralai Pattu North', 'Koralai Pattu South', 'Koralai Pattu West', 'Manmunai North', 'Manmunai Pattu', 'Manmunai S. and Eruvil Pattu', 'Manmunai South West', 'Manmunai West', 'Porativu Pattu'],
  Ampara: ['Addalaichenai', 'Akkayarapattu', 'Alayadiwembu', 'Ampara', 'Damana', 'Dehiattakandiya', 'Irakkamam', 'Kalmunai', 'Karaitivu', 'Lahugala', 'Mahaoya', 'Navithanveli', 'Nintavur', 'Padiyathalawa', 'Pottuvil', 'Sainthamaruthu', 'Sammanthurai', 'Thirukkovil', 'Uhana'],
  Trincomalee: ['Gomarankadawala', 'Kantale', 'Kinniya', 'Kuchchaveli', 'Morawewa', 'Muttur', 'Padavi Sri Pura', 'Seruvila', 'Thampalagamuwa', 'Trincomalee Town and Gravets', 'Verugal'],
  Kurunegala: ['Alawwa', 'Bingiriya', 'Ehetuwewa', 'Galgamuwa', 'Ganewatta', 'Giribawa', 'Ibbagamuwa', 'Katuwana', 'Kuliyapitiya East', 'Kuliyapitiya West', 'Kurunegala', 'Mahawa', 'Mallawapitiya', 'Maspotha', 'Mawathagama', 'Narammala', 'Nikaweratiya', 'Panduwasnuwara East', 'Panduwasnuwara West', 'Pannala', 'Polgahawela', 'Polpithigama', 'Ridigama', 'Udubaddawa', 'Wariyapola', 'Weerambugedara'],
  Puttalam: ['Anamaduwa', 'Arachchikattuwa', 'Chilaw', 'Dankotuwa', 'Kalpitiya', 'Madampe', 'Mahakumbukkadawala', 'Mahawewa', 'Mundalama', 'Nattandiya', 'Nawagattegama', 'Pallama', 'Puttalam', 'Vanathavilluwa', 'Wennappuwa'],
  Anuradhapura: ['Anuradhapura', 'Galenbindunuwewa', 'Galnewa', 'Horowpothana', 'Ipalogama', 'Kahatagasdigiliya', 'Kebithigollewa', 'Kekirawa', 'Mahavilachchiya', 'Medawachchiya', 'Mihintale', 'Nachchaduwa', 'Nochchiyagama', 'Nuwaragam Palatha Central', 'Nuwaragam Palatha East', 'Padaviya', 'Palagala', 'Palugaswewa', 'Rajanganaya', 'Rambewa', 'Thalawa', 'Thambuttegama', 'Thirappane'],
  Polonnaruwa: ['Dimbulagala', 'Elahera', 'Hingurakgoda', 'Lankapura', 'Medirigiriya', 'Polonnaruwa', 'Thamankaduwa', 'Welikanda'],
  Badulla: ['Badulla', 'Bandarawela', 'Ella', 'Haldummulla', 'Hali-Ela', 'Haputale', 'Kandaketiya', 'Lunugala', 'Mahiyanganaya', 'Meegahakivula', 'Passara', 'Rideemaliyadda', 'Soranathota', 'Uva-Paranagama', 'Welimada'],
  Monaragala: ['Badalkumbura', 'Bibile', 'Buttala', 'Katharagama', 'Madulla', 'Medagama', 'Monaragala', 'Sevanagala', 'Siyambalanduwa', 'Thanamalwila', 'Wellawaya'],
  Ratnapura: ['Ayagama', 'Balangoda', 'Eheliyagoda', 'Elapatha', 'Embilipitiya', 'Godakawela', 'Imbulpe', 'Kahawatta', 'Kuruwita', 'Kiriella', 'Kolonne', 'Nivithigala', 'Opanayaka', 'Pelmadulla', 'Ratnapura', 'Weligepola'],
  Kegalle: ['Aranayaka', 'Bulathkohupitiya', 'Dehiovita', 'Deraniyagala', 'Galigamuwa', 'Kegalle', 'Mawanella', 'Rambukkana', 'Ruwanwella', 'Warakapola', 'Yatiyanthota'],
};

export const DISTRICT_CENTERS: Record<string, { lat: number; lng: number }> = {
  Ampara: { lat: 7.2833, lng: 81.6667 },
  Anuradhapura: { lat: 8.3356, lng: 80.4067 },
  Badulla: { lat: 6.9898, lng: 81.0556 },
  Batticaloa: { lat: 7.717, lng: 81.7 },
  Colombo: { lat: 6.9271, lng: 79.8612 },
  Galle: { lat: 6.0535, lng: 80.221 },
  Gampaha: { lat: 7.0917, lng: 80.0 },
  Hambantota: { lat: 6.1241, lng: 81.1185 },
  Jaffna: { lat: 9.6615, lng: 80.0255 },
  Kalutara: { lat: 6.5854, lng: 79.9607 },
  Kandy: { lat: 7.2906, lng: 80.6337 },
  Kegalle: { lat: 7.2513, lng: 80.3464 },
  Kilinochchi: { lat: 9.3803, lng: 80.377 },
  Kurunegala: { lat: 7.4863, lng: 80.3624 },
  Mannar: { lat: 8.978, lng: 79.9044 },
  Matale: { lat: 7.4675, lng: 80.6234 },
  Matara: { lat: 5.9549, lng: 80.555 },
  Monaragala: { lat: 6.8727, lng: 81.3506 },
  Mullaitivu: { lat: 9.2671, lng: 80.812 },
  'Nuwara Eliya': { lat: 6.9497, lng: 80.7891 },
  Polonnaruwa: { lat: 7.9403, lng: 81.0188 },
  Puttalam: { lat: 8.0362, lng: 79.8283 },
  Ratnapura: { lat: 6.6828, lng: 80.3992 },
  Trincomalee: { lat: 8.5874, lng: 81.2152 },
  Vavuniya: { lat: 8.7514, lng: 80.4997 },
};

export function getDistrictsByProvince(province?: string) {
  return province ? DISTRICTS_BY_PROVINCE[province] || [] : [];
}

export function getDsDivisionsByDistrict(district?: string) {
  return district ? DS_DIVISIONS_BY_DISTRICT[district] || [] : [];
}

export function getDistrictCenter(district?: string) {
  return district && DISTRICT_CENTERS[district] ? DISTRICT_CENTERS[district] : { lat: 7.8731, lng: 80.7718 };
}