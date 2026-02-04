import { AfendaCard, AfendaCardText, AfendaCardTitle } from "@afenda/shadcn";

export function AfendaBanner() {
  return (
    <AfendaCard aria-label="Afenda Banner">
      <AfendaCardTitle>Afenda</AfendaCardTitle>
      <AfendaCardText>Server component (UI only).</AfendaCardText>
    </AfendaCard>
  );
}
