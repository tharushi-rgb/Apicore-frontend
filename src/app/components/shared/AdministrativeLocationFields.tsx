import {
  PROVINCES,
  getDistrictsByProvince,
  getDsDivisionsByDistrict,
} from '../../constants/sriLankaLocations';
import { t, type Language } from '../../i18n';

interface AdministrativeLocationFieldsProps {
  selectedLanguage?: Language;
  province: string;
  district: string;
  dsDivision: string;
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onDsDivisionChange: (value: string) => void;
  required?: boolean;
}

export function AdministrativeLocationFields({
  selectedLanguage = 'en',
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
          <label className="app-label">{t('province', selectedLanguage)}{suffix}</label>
          <select
            value={province}
            onChange={(event) => onProvinceChange(event.target.value)}
            className="app-input"
          >
            <option value="">{t('selectProvince', selectedLanguage)}</option>
            {PROVINCES.map((provinceOption) => (
              <option key={provinceOption} value={provinceOption}>
                {provinceOption}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="app-label">{t('district', selectedLanguage)}{suffix}</label>
          <select
            value={district}
            onChange={(event) => onDistrictChange(event.target.value)}
            className="app-input"
          >
            <option value="">{t('selectDistrictReg', selectedLanguage)}</option>
            {districts.map((districtOption) => (
              <option key={districtOption} value={districtOption}>
                {districtOption}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="app-label">{t('dsDivision', selectedLanguage)}{suffix}</label>
        <select
          value={dsDivision}
          onChange={(event) => onDsDivisionChange(event.target.value)}
          className="app-input"
        >
          <option value="">{t('selectDsDivision', selectedLanguage)}</option>
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
