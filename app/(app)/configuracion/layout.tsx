import { PageHeader } from "@/components/shell/page-header";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader
        title="Configuración"
        description="Tu empresa, las personas que cuentan y tu cuenta."
      />
      <div className="mx-auto grid max-w-4xl gap-8 p-4 sm:p-6">
        <SettingsTabs />
        {children}
      </div>
    </>
  );
}
