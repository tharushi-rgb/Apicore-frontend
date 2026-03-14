import {
  PROVINCES,
  getDistrictsByProvince,
  getDsDivisionsByDistrict,
} from '../constants/sriLankaLocations';

interface AdministrativeLocationFieldsProps {
  province: string;
  district: string;
  dsDivision: string;
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onDsDivisionChange: (value: string) => void;
  required?: boolean;
}

export function AdministrativeLocationFields({
  province,
  district,
  dsDivision,
  onProvinceChange,
  onDistrictChange,
  onDsDivisionChange,
  required = false,
}: AdministrativeLocationFieldsProps) {
  const districts = getDistrictsByProvince(province);
  const dsDivisions = getDsDivisionsByDistrict(district);
  const suffix = required ? ' *' : '';

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="app-label">Province{suffix}</label>
          <select
            value={province}
            onChange={(event) => onProvinceChange(event.target.value)}
            className="app-input"
          >
            <option value="">Select province</option>
            {PROVINCES.map((provinceOption) => (
              <option key={provinceOption} value={provinceOption}>
                {provinceOption}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="app-label">District{suffix}</label>
          <select
            value={district}
            onChange={(event) => onDistrictChange(event.target.value)}
            className="app-input"
          >
            <option value="">Select district</option>
            {districts.map((districtOption) => (
              <option key={districtOption} value={districtOption}>
                {districtOption}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="app-label">DS Division{suffix}</label>
        <select
          value={dsDivision}
          onChange={(event) => onDsDivisionChange(event.target.value)}
          className="app-input"
        >
          <option value="">Select DS division</option>
          {dsDivisions.map((dsOption) => (
            <option key={dsOption} value={dsOption}>
              {dsOption}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
