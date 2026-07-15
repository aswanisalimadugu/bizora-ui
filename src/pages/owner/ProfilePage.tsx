import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { ImagePlus, Store } from 'lucide-react';
import { createBusiness, updateBusiness } from '../../api/businessApi';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { AiGenerateButton } from '../../components/common/AiGenerateButton';
import { VoiceInputButton } from '../../components/common/VoiceInputButton';
import { Input, Textarea } from '../../components/common/Input';
import { Loader } from '../../components/common/Loader';
import { QRCode } from '../../components/business/QRCode';
import { PagePlanScope } from '../../components/owner/PagePlanScope';
import { useBusinessStore } from '../../store/businessStore';
import { useAiActionStore } from '../../store/aiActionStore';
import type { Business } from '../../types';
import { businessPageUrl, getErrorMessage, imageUrl } from '../../utils/format';

interface ProfileForm {
  businessName: string;
  description: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  businessHours: string;
  isOpen: boolean;
}

export default function ProfilePage() {
  const { activeBusiness, loaded, refresh } = useBusinessStore();
  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState<File | undefined>();
  const [cover, setCover] = useState<File | undefined>();
  const [logoPreview, setLogoPreview] = useState<string | undefined>();
  const [coverPreview, setCoverPreview] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileForm>();

  useEffect(() => {
    if (activeBusiness) {
      reset({
        businessName: activeBusiness.businessName ?? '',
        description: activeBusiness.description ?? '',
        phone: activeBusiness.phone ?? '',
        whatsappNumber: activeBusiness.whatsappNumber ?? '',
        address: activeBusiness.address ?? '',
        city: activeBusiness.city ?? '',
        state: activeBusiness.state ?? '',
        pincode: activeBusiness.pincode ?? '',
        businessHours: activeBusiness.businessHours ?? '',
        isOpen: activeBusiness.isOpen !== false,
      });
      setLogoPreview(imageUrl(activeBusiness.logoUrl));
      setCoverPreview(imageUrl(activeBusiness.coverImageUrl));
    }
  }, [activeBusiness, reset]);

  const profileFillTick = useAiActionStore((s) => s.profileFillTick);

  useEffect(() => {
    const pending = useAiActionStore.getState().consumePendingProfile();
    if (!pending) return;

    if (pending.businessName) setValue('businessName', pending.businessName);
    if (pending.description) setValue('description', pending.description);
    if (pending.phone) setValue('phone', pending.phone);
    if (pending.whatsappNumber) setValue('whatsappNumber', pending.whatsappNumber);
    if (pending.address) setValue('address', pending.address);
    if (pending.city) setValue('city', pending.city);
    if (pending.state) setValue('state', pending.state);
    if (pending.pincode) setValue('pincode', pending.pincode);
    if (pending.businessHours) setValue('businessHours', pending.businessHours);

    const runAutoCreate = async () => {
      if (!pending.autoCreate || activeBusiness || !pending.businessName) {
        toast.info('AI filled your profile — review and save');
        return;
      }
      setSaving(true);
      try {
        await createBusiness({
          businessName: pending.businessName,
          description: pending.description,
          phone: pending.phone,
          whatsappNumber: pending.whatsappNumber ?? pending.phone,
          address: pending.address,
          city: pending.city,
          state: pending.state,
          pincode: pending.pincode,
          businessHours: pending.businessHours,
          isOpen: true,
        });
        toast.success('Business profile created');
        await refresh();
      } catch (error) {
        toast.error(getErrorMessage(error, 'Could not create profile — please save manually'));
      } finally {
        setSaving(false);
      }
    };

    void runAutoCreate();
  }, [profileFillTick, activeBusiness, setValue, refresh]);

  const onLogoChange = (file?: File) => {
    setLogo(file);
    if (file) setLogoPreview(URL.createObjectURL(file));
  };
  const onCoverChange = (file?: File) => {
    setCover(file);
    if (file) setCoverPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values: ProfileForm) => {
    setSaving(true);
    try {
      const payload: Partial<Business> = { ...values };
      if (activeBusiness) {
        await updateBusiness(activeBusiness.id, payload, logo, cover);
        toast.success('Profile updated');
      } else {
        await createBusiness(payload, logo, cover);
        toast.success('Business profile created');
      }
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save profile'));
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <Loader />;

  return (
    <div className="space-y-5">
      <PagePlanScope page="profile" />
      <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 lg:col-span-2">
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Brand images</h3>
          <div className="mt-4 space-y-4">
            <div className="relative h-36 overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
              {coverPreview ? (
                <img src={coverPreview} alt="cover" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  <ImagePlus className="mr-2 h-5 w-5" /> Cover image
                </div>
              )}
              <label className="absolute bottom-2 right-2 cursor-pointer rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow">
                Change cover
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onCoverChange(e.target.files?.[0])}
                />
              </label>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" className="h-full w-full object-cover" />
                ) : (
                  <Store className="h-7 w-7 text-slate-400" />
                )}
              </div>
              <label className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Upload logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onLogoChange(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-slate-900">Business details</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Business name</label>
              <div className="flex gap-2">
                <Input
                  error={errors.businessName?.message}
                  className="flex-1"
                  {...register('businessName', { required: 'Business name is required' })}
                />
                <VoiceInputButton onResult={(text) => setValue('businessName', text)} size="md" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <AiGenerateButton
                  type="business_bio"
                  params={{ name: watch('businessName'), city: watch('city') }}
                  disabled={!watch('businessName')}
                  onResult={(text) => setValue('description', text)}
                  label="Write with AI"
                />
              </div>
              <Textarea rows={3} {...register('description')} />
            </div>
            <Input label="Phone" {...register('phone', { pattern: { value: /^[0-9+\s]{10,15}$/, message: 'Invalid phone' } })} />
            <Input
              label="WhatsApp number"
              error={errors.whatsappNumber?.message}
              {...register('whatsappNumber', {
                pattern: { value: /^[0-9+\s]{10,15}$/, message: 'Enter a valid number' },
              })}
            />
            <div className="sm:col-span-2">
              <Input label="Address" {...register('address')} />
            </div>
            <Input label="City" {...register('city')} />
            <Input label="State" {...register('state')} />
            <Input
              label="Pincode"
              {...register('pincode', {
                validate: (v) => !v || /^[0-9]{6}$/.test(v) || 'Enter 6-digit pincode',
              })}
            />
            <div className="sm:col-span-2">
              <Input
                label="Business hours"
                placeholder="e.g. Mon–Sat: 9 AM – 9 PM"
                {...register('businessHours', { maxLength: { value: 500, message: 'Too long' } })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 sm:col-span-2">
              <input type="checkbox" className="h-4 w-4 rounded" {...register('isOpen')} />
              Show as open on public page
            </label>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" loading={saving}>
              {activeBusiness ? 'Save changes' : 'Create business'}
            </Button>
          </div>
        </Card>
      </form>

      {activeBusiness && (
        <Card className="h-fit">
          <h3 className="text-base font-semibold text-slate-900">Share your page</h3>
          <p className="mt-1 text-sm text-slate-500">Customers can scan to visit your store.</p>
          <div className="mt-5">
            <QRCode value={businessPageUrl(activeBusiness.slug)} label={`/business/${activeBusiness.slug}`} />
          </div>
        </Card>
      )}
      </div>
    </div>
  );
}
