'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/auth';
import {
  apiClient,
  CompanyProfile,
  CompanyProfileInput,
  CompanyAddressInput,
  CompanyFiscalConfig,
  CompanyFiscalInput,
  CompanySecurityConfig,
  CompanySecurityInput,
} from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  User,
  Shield,
  Trash2,
  Settings,
  Link,
  Plus,
  Building2,
  Loader2,
  IndianRupee,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PlaidLink from '@/components/ui/PlaidLink';

interface AddressForm extends Omit<CompanyAddressInput, 'isPrimary' | 'isBilling' | 'isShipping'> {
  isPrimary?: boolean;
  isBilling?: boolean;
  isShipping?: boolean;
}

const emptyAddress: AddressForm = {
  label: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  isPrimary: false,
  isBilling: false,
  isShipping: false,
};

const mapProfileToForm = (
  profile: CompanyProfile | null,
  fallbackName?: string
): CompanyProfileInput & { addresses: AddressForm[] } => {
  if (!profile) {
    return {
      displayName: fallbackName ?? '',
      legalName: '',
      mailingName: '',
      baseCurrency: 'INR',
      country: '',
      state: '',
      city: '',
      postalCode: '',
      phone: '',
      mobile: '',
      email: '',
      website: '',
      addresses: [],
    };
  }

  return {
    displayName: profile.displayName || fallbackName || '',
    legalName: profile.legalName || '',
    mailingName: profile.mailingName || '',
    baseCurrency: profile.baseCurrency || 'INR',
    country: profile.country || '',
    state: profile.state || '',
    city: profile.city || '',
    postalCode: profile.postalCode || '',
    phone: profile.phone || '',
    mobile: profile.mobile || '',
    email: profile.email || '',
    website: profile.website || '',
    addresses: (profile.addresses || []).map((address) => ({
      id: address.id,
      label: address.label || '',
      line1: address.line1 || '',
      line2: address.line2 || '',
      city: address.city || '',
      state: address.state || '',
      country: address.country || '',
      postalCode: address.postalCode || '',
      isPrimary: address.isPrimary,
      isBilling: address.isBilling,
      isShipping: address.isShipping,
    })),
  };
};

interface FiscalForm {
  financialYearStart: string;
  booksStart: string;
  allowBackdatedEntries: boolean;
  backdatedFrom?: string;
  enableEditLog: boolean;
}

interface CurrencyForm {
  baseCurrencyCode: string;
  baseCurrencySymbol: string;
  baseCurrencyFormalName: string;
  decimalPlaces: number;
  decimalSeparator: string;
  thousandSeparator: string;
  symbolOnRight: boolean;
  spaceBetweenAmountAndSymbol: boolean;
  showAmountInMillions: boolean;
}

interface SecurityForm {
  tallyVaultEnabled: boolean;
  initialTallyVaultEnabled: boolean;
  userAccessControlEnabled: boolean;
  multiFactorRequired: boolean;
  tallyVaultPasswordHint: string;
  newPassword: string;
  confirmNewPassword: string;
  currentPassword: string;
}

const toDateInputValue = (value?: string | null) => {
  if (!value) return '';
  return value.slice(0, 10);
};

const mapFiscalToForm = (fiscal: CompanyFiscalConfig | null): FiscalForm => {
  const today = new Date();
  const defaultFinancialYearStart = () => {
    const year = today.getUTCMonth() >= 3 ? today.getUTCFullYear() : today.getUTCFullYear() - 1;
    return new Date(Date.UTC(year, 3, 1)).toISOString();
  };

  if (!fiscal) {
    const financialYearStart = defaultFinancialYearStart();
    return {
      financialYearStart: toDateInputValue(financialYearStart),
      booksStart: toDateInputValue(today.toISOString()),
      allowBackdatedEntries: true,
      backdatedFrom: toDateInputValue(financialYearStart),
      enableEditLog: false,
    };
  }

  return {
    financialYearStart: toDateInputValue(fiscal.financialYearStart),
    booksStart: toDateInputValue(fiscal.booksStart),
    allowBackdatedEntries: fiscal.allowBackdatedEntries,
    backdatedFrom: fiscal.backdatedFrom ? toDateInputValue(fiscal.backdatedFrom) : '',
    enableEditLog: fiscal.enableEditLog,
  };
};

const toISOStringWithUTC = (value: string) => {
  if (!value) {
    throw new Error('Date value required');
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value');
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();
};

const mapSecurityToForm = (security: CompanySecurityConfig | null): SecurityForm => ({
  tallyVaultEnabled: security?.tallyVaultEnabled ?? false,
  initialTallyVaultEnabled: security?.tallyVaultEnabled ?? false,
  userAccessControlEnabled: security?.userAccessControlEnabled ?? false,
  multiFactorRequired: security?.multiFactorRequired ?? false,
  tallyVaultPasswordHint: security?.tallyVaultPasswordHint || '',
  newPassword: '',
  confirmNewPassword: '',
  currentPassword: '',
});

const mapCurrencyToForm = (currency: CompanyCurrencyConfig | null): CurrencyForm => ({
  baseCurrencyCode: currency?.baseCurrencyCode || 'INR',
  baseCurrencySymbol: currency?.baseCurrencySymbol || '₹',
  baseCurrencyFormalName: currency?.baseCurrencyFormalName || 'Indian Rupee',
  decimalPlaces: currency?.decimalPlaces ?? 2,
  decimalSeparator: currency?.decimalSeparator || '.',
  thousandSeparator: currency?.thousandSeparator || ',',
  symbolOnRight: currency?.symbolOnRight ?? false,
  spaceBetweenAmountAndSymbol: currency?.spaceBetweenAmountAndSymbol ?? false,
  showAmountInMillions: currency?.showAmountInMillions ?? false,
});

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [plaidItems, setPlaidItems] = useState<any[]>([]);
  const [profileForm, setProfileForm] = useState<(CompanyProfileInput & { addresses: AddressForm[] }) | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [fiscalForm, setFiscalForm] = useState<FiscalForm | null>(null);
  const [fiscalLoading, setFiscalLoading] = useState(true);
  const [fiscalSaving, setFiscalSaving] = useState(false);
  const [securityForm, setSecurityForm] = useState<SecurityForm | null>(null);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [currencyForm, setCurrencyForm] = useState<CurrencyForm | null>(null);
  const [currencyLoading, setCurrencyLoading] = useState(true);
  const [currencySaving, setCurrencySaving] = useState(false);

  const hasAddresses = useMemo(() => (profileForm?.addresses?.length ?? 0) > 0, [profileForm]);

  useEffect(() => {
    fetchPlaidItems();
    loadCompanyData();
  }, []);

  const fetchPlaidItems = async () => {
    setPlaidItems([
      { id: '1', institutionName: 'Bank of America', accounts: { length: 2 } },
      { id: '2', institutionName: 'Chase', accounts: { length: 1 } },
    ]);
  };

  const loadCompanyData = async () => {
    try {
      setProfileLoading(true);
      setFiscalLoading(true);
      setSecurityLoading(true);
      setCurrencyLoading(true);
      const [profileResponse, fiscalResponse, securityResponse, currencyResponse] = await Promise.all([
        apiClient.company.getProfile(),
        apiClient.company.getFiscal(),
        apiClient.company.getSecurity(),
        apiClient.company.getCurrency(),
      ]);
      const fallbackName = user?.startup?.name;
      if (profileResponse.success) {
        setProfileForm(mapProfileToForm(profileResponse.data || null, fallbackName));
      } else {
        setProfileForm(mapProfileToForm(null, fallbackName));
        toast.error(profileResponse.error || 'Failed to load company profile');
      }

      if (fiscalResponse.success) {
        setFiscalForm(mapFiscalToForm(fiscalResponse.data || null));
      } else {
        setFiscalForm(mapFiscalToForm(null));
        toast.error(fiscalResponse.error || 'Failed to load fiscal configuration');
      }

      if (securityResponse.success) {
        setSecurityForm(mapSecurityToForm(securityResponse.data || null));
      } else {
        setSecurityForm(mapSecurityToForm(null));
        toast.error(securityResponse.error || 'Failed to load security configuration');
      }

      if (currencyResponse.success) {
        setCurrencyForm(mapCurrencyToForm(currencyResponse.data || null));
      } else {
        setCurrencyForm(mapCurrencyToForm(null));
        toast.error(currencyResponse.error || 'Failed to load currency configuration');
      }
    } catch (error) {
      console.error('Failed to load company settings:', error);
      setProfileForm(mapProfileToForm(null, user?.startup?.name));
      setFiscalForm(mapFiscalToForm(null));
      setSecurityForm(mapSecurityToForm(null));
      setCurrencyForm(mapCurrencyToForm(null));
      toast.error('Unable to load company settings');
    } finally {
      setProfileLoading(false);
      setFiscalLoading(false);
      setSecurityLoading(false);
      setCurrencyLoading(false);
    }
  };
  
  const handlePlaidSuccess = () => {
    toast.success('Account connected! Refreshing...');
    setTimeout(fetchPlaidItems, 1000);
  };

  const handleDisconnectBank = async (plaidItemId: string) => {
    toast.success('Bank account disconnected.');
    setPlaidItems(plaidItems.filter((item) => item.id !== plaidItemId));
  };

  const handleProfileFieldChange = (
    field: keyof CompanyProfileInput,
    value: string
  ) => {
    setProfileForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleAddressChange = (
    index: number,
    field: keyof AddressForm,
    value: string | boolean
  ) => {
    setProfileForm((prev) => {
      if (!prev) return prev;
      const addresses = prev.addresses ? [...prev.addresses] : [];
      const current = addresses[index] || { ...emptyAddress };
      addresses[index] = { ...current, [field]: value } as AddressForm;
      return { ...prev, addresses };
    });
  };

  const handleAddAddress = () => {
    setProfileForm((prev) => {
      if (!prev) return prev;
      const addresses = prev.addresses ? [...prev.addresses] : [];
      addresses.push({ ...emptyAddress, isPrimary: addresses.length === 0 });
      return { ...prev, addresses };
    });
  };

  const handleRemoveAddress = (index: number) => {
    setProfileForm((prev) => {
      if (!prev) return prev;
      const addresses = prev.addresses ? [...prev.addresses] : [];
      addresses.splice(index, 1);
      if (addresses.length > 0 && !addresses.some((addr) => addr.isPrimary)) {
        addresses[0].isPrimary = true;
      }
      return { ...prev, addresses };
    });
  };

  const handleAddressToggle = (
    index: number,
    field: 'isPrimary' | 'isBilling' | 'isShipping'
  ) => {
    setProfileForm((prev) => {
      if (!prev) return prev;
      const addresses = prev.addresses ? [...prev.addresses] : [];
      const current = addresses[index] || { ...emptyAddress };

      if (field === 'isPrimary') {
        const updated = addresses.map((addr, idx) => ({
          ...addr,
          isPrimary: idx === index,
        }));
        return { ...prev, addresses: updated };
      }

      addresses[index] = { ...current, [field]: !current[field] } as AddressForm;
      return { ...prev, addresses };
    });
  };

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profileForm) return;

    try {
      setProfileSaving(true);
      const payload: CompanyProfileInput = {
        ...profileForm,
        addresses: (profileForm.addresses || []).map((address) => ({
          id: address.id,
          label: address.label?.trim() || undefined,
          line1: address.line1,
          line2: address.line2?.trim() || undefined,
          city: address.city?.trim() || undefined,
          state: address.state?.trim() || undefined,
          country: address.country?.trim() || undefined,
          postalCode: address.postalCode?.trim() || undefined,
          isPrimary: !!address.isPrimary,
          isBilling: !!address.isBilling,
          isShipping: !!address.isShipping,
        })),
      };

      const response = await apiClient.company.updateProfile(payload);
      if (!response.success || !response.data) {
        toast.error(response.error || 'Failed to update company profile');
        return;
      }

      setProfileForm(mapProfileToForm(response.data, user?.startup?.name));
      if (user) {
        setUser({
          ...user,
          startup: {
            ...user.startup,
            companyProfile: response.data,
          },
        });
      }

      toast.success('Company profile updated successfully');
    } catch (error) {
      console.error('Update company profile error:', error);
      toast.error('Unable to update company profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleFiscalFieldChange = (
    field: keyof FiscalForm,
    value: string | boolean
  ) => {
    setFiscalForm((prev) => {
      if (!prev) return prev;
      if (field === 'allowBackdatedEntries') {
        const allow = Boolean(value);
        return {
          ...prev,
          allowBackdatedEntries: allow,
          backdatedFrom: allow ? prev.backdatedFrom || prev.financialYearStart : '',
        };
      }
      if (field === 'financialYearStart' && typeof value === 'string') {
        return {
          ...prev,
          financialYearStart: value,
          backdatedFrom:
            prev.allowBackdatedEntries && (!prev.backdatedFrom || prev.backdatedFrom === prev.financialYearStart)
              ? value
              : prev.backdatedFrom,
        };
      }
      return { ...prev, [field]: value } as FiscalForm;
    });
  };

  const handleFiscalSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fiscalForm) return;

    try {
      setFiscalSaving(true);
      const payload: CompanyFiscalInput = {
        financialYearStart: toISOStringWithUTC(fiscalForm.financialYearStart),
        booksStart: toISOStringWithUTC(fiscalForm.booksStart),
        allowBackdatedEntries: fiscalForm.allowBackdatedEntries,
        backdatedFrom:
          fiscalForm.allowBackdatedEntries && fiscalForm.backdatedFrom
            ? toISOStringWithUTC(fiscalForm.backdatedFrom)
            : null,
        enableEditLog: fiscalForm.enableEditLog,
      };

      const response = await apiClient.company.updateFiscal(payload);
      if (!response.success || !response.data) {
        toast.error(response.error || 'Failed to update fiscal configuration');
        return;
      }

      setFiscalForm(mapFiscalToForm(response.data));
      if (user) {
        setUser({
          ...user,
          startup: {
            ...user.startup,
            fiscalConfig: response.data,
          },
        });
      }

      toast.success('Fiscal configuration updated successfully');
    } catch (error) {
      console.error('Update fiscal configuration error:', error);
      toast.error('Unable to update fiscal configuration');
    } finally {
      setFiscalSaving(false);
    }
  };

  const handleSecurityFieldChange = <K extends keyof SecurityForm>(field: K, value: SecurityForm[K]) => {
    setSecurityForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSecuritySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!securityForm) return;

    const {
      tallyVaultEnabled,
      initialTallyVaultEnabled,
      userAccessControlEnabled,
      multiFactorRequired,
      tallyVaultPasswordHint,
      newPassword,
      confirmNewPassword,
      currentPassword,
    } = securityForm;

    const enablingTallyVault = !initialTallyVaultEnabled && tallyVaultEnabled;
    const disablingTallyVault = initialTallyVaultEnabled && !tallyVaultEnabled;
    const rotatingPassword = initialTallyVaultEnabled && tallyVaultEnabled && newPassword.trim().length > 0;

    try {
      if (enablingTallyVault) {
        if (!newPassword.trim() || !confirmNewPassword.trim()) {
          toast.error('Provide and confirm a TallyVault password to enable encryption.');
          return;
        }
        if (newPassword !== confirmNewPassword) {
          toast.error('TallyVault passwords do not match.');
          return;
        }
      }

      if (disablingTallyVault && !currentPassword.trim()) {
        toast.error('Current TallyVault password is required to disable encryption.');
        return;
      }

      if (rotatingPassword) {
        if (newPassword !== confirmNewPassword) {
          toast.error('TallyVault passwords do not match.');
          return;
        }
        if (!currentPassword.trim()) {
          toast.error('Current TallyVault password is required to rotate encryption password.');
          return;
        }
      }

      const payload: CompanySecurityInput = {
        tallyVaultEnabled,
        userAccessControlEnabled,
        multiFactorRequired,
        tallyVaultPasswordHint: tallyVaultPasswordHint.trim() ? tallyVaultPasswordHint.trim() : null,
      };

      if (enablingTallyVault || rotatingPassword) {
        payload.newTallyVaultPassword = newPassword;
      }

      if (disablingTallyVault || rotatingPassword) {
        payload.currentTallyVaultPassword = currentPassword.trim() || undefined;
      }

      setSecuritySaving(true);
      const response = await apiClient.company.updateSecurity(payload);
      if (!response.success || !response.data) {
        toast.error(response.error || 'Failed to update security configuration');
        return;
      }

      const updatedConfig = response.data;
      setSecurityForm({
        ...mapSecurityToForm(updatedConfig),
        initialTallyVaultEnabled: updatedConfig.tallyVaultEnabled,
      });

      if (user) {
        setUser({
          ...user,
          startup: {
            ...user.startup,
            securityConfig: updatedConfig,
          },
        });
      }

      toast.success('Security configuration updated successfully');
    } catch (error) {
      console.error('Update security configuration error:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to update security configuration');
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleCurrencyFieldChange = <K extends keyof CurrencyForm>(field: K, value: CurrencyForm[K]) => {
    setCurrencyForm(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleCurrencySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currencyForm) return;

    const {
      baseCurrencyCode,
      baseCurrencySymbol,
      baseCurrencyFormalName,
      decimalPlaces,
      decimalSeparator,
      thousandSeparator,
      symbolOnRight,
      spaceBetweenAmountAndSymbol,
      showAmountInMillions,
    } = currencyForm;

    if (!baseCurrencyCode.trim()) {
      toast.error('Base currency code is required');
      return;
    }

    if (!baseCurrencySymbol.trim()) {
      toast.error('Currency symbol is required');
      return;
    }

    const payload: CompanyCurrencyInput = {
      baseCurrencyCode: baseCurrencyCode.trim().toUpperCase(),
      baseCurrencySymbol: baseCurrencySymbol.trim(),
      baseCurrencyFormalName: baseCurrencyFormalName.trim() || undefined,
      decimalPlaces: Number.isFinite(decimalPlaces) ? Number(decimalPlaces) : 2,
      decimalSeparator: decimalSeparator ? decimalSeparator.slice(0, 1) : '.',
      thousandSeparator: thousandSeparator ? thousandSeparator.slice(0, 1) : ',',
      symbolOnRight,
      spaceBetweenAmountAndSymbol,
      showAmountInMillions,
    };

    setCurrencySaving(true);
    try {
      const response = await apiClient.company.updateCurrency(payload);
      if (!response.success || !response.data) {
        toast.error(response.error || 'Failed to update currency configuration');
        return;
      }

      const updatedConfig = response.data;
      setCurrencyForm(mapCurrencyToForm(updatedConfig));
      setProfileForm(prev =>
        prev ? { ...prev, baseCurrency: updatedConfig.baseCurrencyCode } : prev
      );

      if (user) {
        const updatedCompanyProfile = user.startup?.companyProfile
          ? {
              ...user.startup.companyProfile,
              baseCurrency: updatedConfig.baseCurrencyCode,
            }
          : user.startup?.companyProfile;

        setUser({
          ...user,
          startup: {
            ...user.startup,
            currencyConfig: updatedConfig,
            companyProfile: updatedCompanyProfile,
          },
        });
      }

      toast.success('Currency configuration updated successfully');
    } catch (error) {
      console.error('Update currency configuration error:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to update currency configuration');
    } finally {
      setCurrencySaving(false);
    }
  };

  const sections = [
    {
      icon: <User className="h-5 w-5" />,
      title: 'Account Information',
      content: (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="mt-1 font-semibold">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd className="mt-1 font-semibold capitalize">{user?.roles.join(', ')}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Organization</dt>
            <dd className="mt-1 font-semibold">{user?.startup?.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Member Since</dt>
            <dd className="mt-1 font-semibold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</dd>
          </div>
        </dl>
      ),
    },
    {
      icon: <Link className="h-5 w-5" />,
      title: 'Connections',
      content: (
        <div className="space-y-4">
          {plaidItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">{item.institutionName || 'Bank Account'}</p>
                <p className="text-xs text-muted-foreground">{item.accounts?.length || 0} accounts</p>
              </div>
              <Button
                onClick={() => handleDisconnectBank(item.id)}
                variant="ghost"
                size="sm"
                className="text-xs text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3 mr-1" /> Disconnect
              </Button>
            </div>
          ))}
          <PlaidLink
            onSuccess={handlePlaidSuccess}
            onError={(e: any) => toast.error(e.display_message || 'An error occurred.')}
          />
        </div>
      ),
    },
  ];

  return (
    <AuthGuard requireAuth={true}>
      <MainLayout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <Settings className="h-8 w-8 text-[#2C2C2C]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#2C2C2C]">Settings</h1>
              <p className="text-sm text-[#2C2C2C]/70 mt-1">Manage your account and application settings.</p>
            </div>
          </div>

          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-[#2C2C2C]" /> Company Profile
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Maintain the legal identity, contact details, and mailing addresses for invoices and statutory filings.
              </p>
            </CardHeader>
            <CardContent>
              {profileLoading || !profileForm ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading company profile...
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleProfileSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name *</Label>
                      <Input
                        id="displayName"
                        required
                        value={profileForm.displayName}
                        onChange={(event) => handleProfileFieldChange('displayName', event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legalName">Legal Name</Label>
                      <Input
                        id="legalName"
                        placeholder="Registered legal entity name"
                        value={profileForm.legalName}
                        onChange={(event) => handleProfileFieldChange('legalName', event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mailingName">Mailing Name</Label>
                      <Input
                        id="mailingName"
                        placeholder="Name printed on invoices and reports"
                        value={profileForm.mailingName}
                        onChange={(event) => handleProfileFieldChange('mailingName', event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={profileForm.country || ''}
                        onChange={(event) => handleProfileFieldChange('country', event.target.value)}
                        placeholder="India"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={profileForm.state || ''}
                        onChange={(event) => handleProfileFieldChange('state', event.target.value)}
                        placeholder="Karnataka"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profileForm.city || ''}
                        onChange={(event) => handleProfileFieldChange('city', event.target.value)}
                        placeholder="Bengaluru"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal / ZIP Code</Label>
                      <Input
                        id="postalCode"
                        value={profileForm.postalCode || ''}
                        onChange={(event) => handleProfileFieldChange('postalCode', event.target.value)}
                        placeholder="560001"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone || ''}
                        onChange={(event) => handleProfileFieldChange('phone', event.target.value)}
                        placeholder="+91-80-4000-1234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile</Label>
                      <Input
                        id="mobile"
                        value={profileForm.mobile || ''}
                        onChange={(event) => handleProfileFieldChange('mobile', event.target.value)}
                        placeholder="+91-98765-43210"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email || ''}
                        onChange={(event) => handleProfileFieldChange('email', event.target.value)}
                        placeholder="finance@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={profileForm.website || ''}
                        onChange={(event) => handleProfileFieldChange('website', event.target.value)}
                        placeholder="https://company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-[#2C2C2C]">Company Addresses</h3>
                        <p className="text-xs text-muted-foreground">
                          Add mailing, billing, and branch addresses. The primary address will be used as default.
                        </p>
                      </div>
                      <Button type="button" variant="secondary" onClick={handleAddAddress}>
                        <Plus className="h-4 w-4 mr-1" /> Add Address
                      </Button>
                    </div>

                    {hasAddresses ? (
                      <div className="space-y-4">
                        {profileForm.addresses.map((address, index) => (
                          <div key={address.id ?? index} className="rounded-xl border border-gray-200 p-4 space-y-4 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-[#2C2C2C]">Address {index + 1}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs text-red-500 hover:text-red-600"
                                onClick={() => handleRemoveAddress(index)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" /> Remove
                              </Button>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor={`address-label-${index}`}>Label</Label>
                                <Input
                                  id={`address-label-${index}`}
                                  value={address.label || ''}
                                  onChange={(event) => handleAddressChange(index, 'label', event.target.value)}
                                  placeholder="Head Office / Billing / Branch"
                                />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor={`address-line1-${index}`}>Address Line 1 *</Label>
                                <Textarea
                                  id={`address-line1-${index}`}
                                  required
                                  value={address.line1}
                                  onChange={(event) => handleAddressChange(index, 'line1', event.target.value)}
                                  placeholder="Door / Street / Building"
                                />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor={`address-line2-${index}`}>Address Line 2</Label>
                                <Input
                                  id={`address-line2-${index}`}
                                  value={address.line2 || ''}
                                  onChange={(event) => handleAddressChange(index, 'line2', event.target.value)}
                                  placeholder="Area / Landmark"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`address-city-${index}`}>City</Label>
                                <Input
                                  id={`address-city-${index}`}
                                  value={address.city || ''}
                                  onChange={(event) => handleAddressChange(index, 'city', event.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`address-state-${index}`}>State</Label>
                                <Input
                                  id={`address-state-${index}`}
                                  value={address.state || ''}
                                  onChange={(event) => handleAddressChange(index, 'state', event.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`address-country-${index}`}>Country</Label>
                                <Input
                                  id={`address-country-${index}`}
                                  value={address.country || ''}
                                  onChange={(event) => handleAddressChange(index, 'country', event.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`address-postal-${index}`}>Postal Code</Label>
                                <Input
                                  id={`address-postal-${index}`}
                                  value={address.postalCode || ''}
                                  onChange={(event) => handleAddressChange(index, 'postalCode', event.target.value)}
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!address.isPrimary}
                                  onChange={() => handleAddressToggle(index, 'isPrimary')}
                                />
                                Primary Address
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!address.isBilling}
                                  onChange={() => handleAddressToggle(index, 'isBilling')}
                                />
                                Billing Address
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!address.isShipping}
                                  onChange={() => handleAddressToggle(index, 'isShipping')}
                                />
                                Shipping Address
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-muted-foreground bg-gray-50">
                        No addresses added yet. Use the button above to capture billing or branch locations.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={loadCompanyData} disabled={profileLoading || profileSaving}>
                      Reset
                    </Button>
                    <Button type="submit" disabled={profileSaving} className="bg-[#607c47] hover:bg-[#4a6129] text-white">
                      {profileSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                        </>
                      ) : (
                        'Save Company Profile'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-[#2C2C2C]" /> Financial Year & Edit Log
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Control financial year boundaries, book start dates, back-dated entry permissions, and audit logging.
              </p>
            </CardHeader>
            <CardContent>
              {fiscalLoading || !fiscalForm ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading fiscal configuration...
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleFiscalSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="financialYearStart">Financial Year Beginning *</Label>
                      <Input
                        id="financialYearStart"
                        type="date"
                        required
                        value={fiscalForm.financialYearStart}
                        onChange={(event) => handleFiscalFieldChange('financialYearStart', event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="booksStart">Books Beginning From *</Label>
                      <Input
                        id="booksStart"
                        type="date"
                        required
                        value={fiscalForm.booksStart}
                        onChange={(event) => handleFiscalFieldChange('booksStart', event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 rounded-xl border border-gray-200 p-4 bg-gray-50">
                    <h3 className="text-sm font-semibold text-[#2C2C2C]">Back-Dated Entries</h3>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={fiscalForm.allowBackdatedEntries}
                          onChange={(event) => handleFiscalFieldChange('allowBackdatedEntries', event.target.checked)}
                        />
                        Allow back-dated entries
                      </label>
                      {fiscalForm.allowBackdatedEntries && (
                        <div className="grid gap-2 md:max-w-sm">
                          <Label htmlFor="backdatedFrom">Back-dated entries permitted from</Label>
                          <Input
                            id="backdatedFrom"
                            type="date"
                            value={fiscalForm.backdatedFrom || ''}
                            onChange={(event) => handleFiscalFieldChange('backdatedFrom', event.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            TallyPrime uses this to control the earliest date allowed for vouchers within the current books.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-gray-200 p-4 bg-gray-50">
                    <h3 className="text-sm font-semibold text-[#2C2C2C]">Audit Trail</h3>
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={fiscalForm.enableEditLog}
                        onChange={(event) => handleFiscalFieldChange('enableEditLog', event.target.checked)}
                      />
                      Enable Edit Log (audit trail for vouchers & masters)
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Mirrors TallyPrime&apos;s edit log feature introduced in Release 2.1 for compliance.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={loadCompanyData} disabled={fiscalLoading || fiscalSaving}>
                      Reset
                    </Button>
                    <Button type="submit" disabled={fiscalSaving} className="bg-[#607c47] hover:bg-[#4a6129] text-white">
                      {fiscalSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                        </>
                      ) : (
                        'Save Fiscal Settings'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-[#2C2C2C]" /> Security Controls
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure TallyVault encryption and granular user access policies for your company.
              </p>
            </CardHeader>
            <CardContent>
              {securityLoading || !securityForm ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading security configuration...
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSecuritySubmit}>
                  <div className="space-y-4 rounded-xl border border-gray-200 p-4 bg-gray-50">
                    <h3 className="text-sm font-semibold text-[#2C2C2C]">TallyVault Encryption</h3>
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={securityForm.tallyVaultEnabled}
                        onChange={(event) =>
                          handleSecurityFieldChange('tallyVaultEnabled', event.target.checked)
                        }
                      />
                      Enable TallyVault encryption for company data
                    </label>

                    {securityForm.tallyVaultEnabled ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="tallyVaultHint">Password Hint (optional)</Label>
                          <Input
                            id="tallyVaultHint"
                            value={securityForm.tallyVaultPasswordHint}
                            onChange={(event) =>
                              handleSecurityFieldChange('tallyVaultPasswordHint', event.target.value)
                            }
                            placeholder="Example: Favourite childhood city"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tallyVaultCurrentPassword">
                            Current TallyVault Password
                          </Label>
                          <Input
                            id="tallyVaultCurrentPassword"
                            type="password"
                            value={securityForm.currentPassword}
                            onChange={(event) =>
                              handleSecurityFieldChange('currentPassword', event.target.value)
                            }
                            placeholder={
                              securityForm.initialTallyVaultEnabled
                                ? 'Enter current password to make changes'
                                : 'Not required when enabling for the first time'
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tallyVaultNewPassword">
                            {securityForm.initialTallyVaultEnabled
                              ? 'New TallyVault Password'
                              : 'Set TallyVault Password *'}
                          </Label>
                          <Input
                            id="tallyVaultNewPassword"
                            type="password"
                            value={securityForm.newPassword}
                            onChange={(event) =>
                              handleSecurityFieldChange('newPassword', event.target.value)
                            }
                            placeholder="Enter strong password"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tallyVaultConfirmPassword">Confirm Password</Label>
                          <Input
                            id="tallyVaultConfirmPassword"
                            type="password"
                            value={securityForm.confirmNewPassword}
                            onChange={(event) =>
                              handleSecurityFieldChange('confirmNewPassword', event.target.value)
                            }
                            placeholder="Re-enter password"
                          />
                        </div>
                        <p className="md:col-span-2 text-xs text-muted-foreground">
                          Store this password securely. It cannot be recovered once lost—mirroring
                          TallyVault behaviour.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">
                          Keep disabled if you do not want company data encrypted. Enabling mirrors
                          TallyVault and hides the company name until the password is provided.
                        </p>
                        {securityForm.initialTallyVaultEnabled && (
                          <div className="space-y-2 md:max-w-sm">
                            <Label htmlFor="tallyVaultDisablePassword">
                              Current TallyVault Password (required to disable)
                            </Label>
                            <Input
                              id="tallyVaultDisablePassword"
                              type="password"
                              value={securityForm.currentPassword}
                              onChange={(event) =>
                                handleSecurityFieldChange('currentPassword', event.target.value)
                              }
                              placeholder="Enter current password to disable"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="space-y-4 rounded-xl border border-gray-200 p-4 bg-gray-50">
                    <h3 className="text-sm font-semibold text-[#2C2C2C]">User Access Controls</h3>
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={securityForm.userAccessControlEnabled}
                        onChange={(event) =>
                          handleSecurityFieldChange(
                            'userAccessControlEnabled',
                            event.target.checked
                          )
                        }
                      />
                      Require company login credentials for every user (Tally user controls)
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={securityForm.multiFactorRequired}
                        onChange={(event) =>
                          handleSecurityFieldChange('multiFactorRequired', event.target.checked)
                        }
                      />
                      Enforce multi-factor authentication for privileged roles
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Toggle granular access policies similar to TallyPrime&apos;s user control
                      features. MFA can be rolled out gradually across roles.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={loadCompanyData}
                      disabled={securityLoading || securitySaving}
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      disabled={securitySaving}
                      className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                    >
                      {securitySaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                        </>
                      ) : (
                        'Save Security Settings'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg border-0 bg-white">
            <CardHeader className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <IndianRupee className="h-5 w-5 text-[#2C2C2C]" /> Base Currency & Formatting
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure how monetary values appear across reports, invoices, and dashboards.
              </p>
            </CardHeader>
            <CardContent>
              {currencyLoading || !currencyForm ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading currency settings...
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleCurrencySubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="currencyCode">Base Currency Code *</Label>
                      <Input
                        id="currencyCode"
                        value={currencyForm.baseCurrencyCode}
                        onChange={event =>
                          handleCurrencyFieldChange('baseCurrencyCode', event.target.value.toUpperCase())
                        }
                        maxLength={3}
                        placeholder="INR"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currencySymbol">Currency Symbol *</Label>
                      <Input
                        id="currencySymbol"
                        value={currencyForm.baseCurrencySymbol}
                        onChange={event =>
                          handleCurrencyFieldChange('baseCurrencySymbol', event.target.value)
                        }
                        maxLength={3}
                        placeholder="₹"
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="currencyName">Formal Name</Label>
                      <Input
                        id="currencyName"
                        value={currencyForm.baseCurrencyFormalName}
                        onChange={event =>
                          handleCurrencyFieldChange('baseCurrencyFormalName', event.target.value)
                        }
                        placeholder="Indian Rupee"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="decimalPlaces">Decimal Places</Label>
                      <Input
                        id="decimalPlaces"
                        type="number"
                        min={0}
                        max={6}
                        value={currencyForm.decimalPlaces}
                        onChange={event =>
                          handleCurrencyFieldChange('decimalPlaces', Number(event.target.value))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="decimalSeparator">Decimal Separator</Label>
                      <Input
                        id="decimalSeparator"
                        value={currencyForm.decimalSeparator}
                        onChange={event =>
                          handleCurrencyFieldChange('decimalSeparator', event.target.value.slice(0, 1))
                        }
                        maxLength={1}
                        placeholder="."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="thousandSeparator">Thousands Separator</Label>
                      <Input
                        id="thousandSeparator"
                        value={currencyForm.thousandSeparator}
                        onChange={event =>
                          handleCurrencyFieldChange('thousandSeparator', event.target.value.slice(0, 1))
                        }
                        maxLength={1}
                        placeholder=","
                      />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-gray-200 p-4 bg-gray-50">
                    <h3 className="text-sm font-semibold text-[#2C2C2C]">Display Preferences</h3>
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={currencyForm.symbolOnRight}
                        onChange={event =>
                          handleCurrencyFieldChange('symbolOnRight', event.target.checked)
                        }
                      />
                      Place currency symbol after the amount
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={currencyForm.spaceBetweenAmountAndSymbol}
                        onChange={event =>
                          handleCurrencyFieldChange('spaceBetweenAmountAndSymbol', event.target.checked)
                        }
                      />
                      Insert space between symbol and amount
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={currencyForm.showAmountInMillions}
                        onChange={event =>
                          handleCurrencyFieldChange('showAmountInMillions', event.target.checked)
                        }
                      />
                      Show large figures in millions (for dashboards & reports)
                    </label>
                    <p className="text-xs text-muted-foreground">
                      These settings influence invoice print-outs, dashboards, and upcoming analytics modules.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={loadCompanyData}
                      disabled={currencyLoading || currencySaving}
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      disabled={currencySaving}
                      className="bg-[#607c47] hover:bg-[#4a6129] text-white"
                    >
                      {currencySaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                        </>
                      ) : (
                        'Save Currency Settings'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {sections.map((section) => (
              <Card key={section.title} className="rounded-2xl shadow-lg border-0 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">{section.icon} {section.title}</CardTitle>
                </CardHeader>
                <CardContent>{section.content}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}

