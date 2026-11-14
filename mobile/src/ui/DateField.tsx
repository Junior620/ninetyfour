import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Platform, View } from "react-native";
import { formatDateLong } from "@/lib/labels";
import { Button, Label, Row } from "./kit";
import { space, usePalette } from "./theme";

const toDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromDay = (day: string) => new Date(`${day}T12:00:00`);

/** Native date picker (iOS compact, Android dialog). Value is an ISO day, YYYY-MM-DD. */
export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (day: string) => void }) {
  const c = usePalette();
  if (Platform.OS === "ios")
    return (
      <View style={{ gap: space.xs }}>
        <Label>{label}</Label>
        <Row>
          <DateTimePicker
            value={fromDay(value)}
            mode="date"
            display="compact"
            locale="fr-FR"
            accentColor={c.accent}
            onValueChange={(_, d) => onChange(toDay(d))}
          />
        </Row>
      </View>
    );
  return (
    <View style={{ gap: space.xs }}>
      <Label>{label}</Label>
      <Button
        kind="secondary"
        title={formatDateLong(value)}
        onPress={() =>
          DateTimePickerAndroid.open({ value: fromDay(value), mode: "date", onValueChange: (_, d) => onChange(toDay(d)) })
        }
      />
    </View>
  );
}
