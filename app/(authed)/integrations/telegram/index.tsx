import { BotConfigPage } from "@/components/integrations/bot-config-page";

export default function IntegrationsTelegramScreen() {
  return (
    <BotConfigPage
      kind="telegram"
      brand={{
        label: "Telegram",
        containerClass: "bg-sky-500/15 border border-sky-500/30",
        iconLabel: "T",
        iconColor: "#7DD3FC",
        helpToken:
          "Open Telegram, message @BotFather, run /newbot, and paste the token it gives you.",
        helpServerLabel: "Group / chat ID",
        helpServerHint:
          "Telegram chat IDs are numeric. Use -100... for supergroups (add @raw_data_bot to your group).",
        serverLabelTitle: "Group name",
        placeholderToken: "1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
        placeholderServer: "-1001234567890",
      }}
    />
  );
}
