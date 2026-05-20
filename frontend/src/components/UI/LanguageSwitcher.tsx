import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useTranslation, Language } from '../../config/i18n';

export default function LanguageSwitcher() {
  const { language, setLanguage, availableLanguages } = useTranslation();

  return (
    <Box sx={{ minWidth: 150 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="language-select-label">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageIcon fontSize="small" />
            Language
          </Box>
        </InputLabel>
        <Select
          labelId="language-select-label"
          value={language}
          label="Language"
          onChange={(e) => setLanguage(e.target.value as Language)}
        >
          {availableLanguages.map((lang: { code: Language; name: string; nativeName: string }) => (
            <MenuItem key={lang.code} value={lang.code}>
              {lang.nativeName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
