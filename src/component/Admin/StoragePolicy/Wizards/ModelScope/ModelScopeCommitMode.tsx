import { FormControl, FormControlLabel, Radio, RadioGroup, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { PolicySetting } from "../../../../../api/dashboard";
import { DenseFilledTextField } from "../../../../Common/StyledComponents";
import SettingForm from "../../../../Pages/Setting/SettingForm";
import { NoMarginHelperText } from "../../../Settings/Settings";

export interface ModelScopeCommitModeProps {
  settings?: PolicySetting;
  onChange: (settings: Partial<PolicySetting>) => void;
  lgWidth?: number;
}

/** The commit mode of a ModelScope policy. */
export type ModelScopeCommitMode = "immediate" | "queue" | "batch";

/**
 * Reads the commit mode out of a policy's settings.
 *
 * The mode is derived rather than stored so a policy saved with both switches
 * set (queued wins, as on the backend) still renders one selected mode.
 */
export const modelScopeCommitMode = (settings?: PolicySetting): ModelScopeCommitMode =>
  settings?.modelscope_queue_commit ? "queue" : settings?.modelscope_batch_commit ? "batch" : "immediate";

/**
 * Builds the settings patch that selects a commit mode. Both switches can never
 * be on at once, so switching mode clears the other one instead of leaving an
 * invalid combination for the API to reject.
 */
export const modelScopeCommitModePatch = (mode: ModelScopeCommitMode): Partial<PolicySetting> => ({
  modelscope_queue_commit: mode === "queue" ? true : undefined,
  modelscope_batch_commit: mode === "batch" ? true : undefined,
});

/**
 * The commit controls of a ModelScope policy.
 *
 * ModelScope rejects repository commits submitted too close together, and the
 * policy picks one of two ways to stay under that limit: queue every commit and
 * space them out, or merge the commits of a burst into one. The modes are
 * mutually exclusive, so they are offered as one choice plus the range of the
 * selected mode.
 */
const ModelScopeCommitMode = ({ settings, onChange, lgWidth = 12 }: ModelScopeCommitModeProps) => {
  const { t } = useTranslation("dashboard");
  const mode = modelScopeCommitMode(settings);

  return (
    <Stack spacing={2}>
      <SettingForm lgWidth={lgWidth}>
        <FormControl fullWidth>
          <RadioGroup
            value={mode}
            onChange={(e) => onChange(modelScopeCommitModePatch(e.target.value as ModelScopeCommitMode))}
          >
            <FormControlLabel
              value="immediate"
              control={<Radio size="small" />}
              label={t("policy.modelscopeCommitModeImmediate")}
            />
            <NoMarginHelperText>{t("policy.modelscopeCommitModeImmediateDes")}</NoMarginHelperText>
            <FormControlLabel
              value="queue"
              control={<Radio size="small" />}
              label={t("policy.modelscopeQueueCommit")}
            />
            <NoMarginHelperText>{t("policy.modelscopeQueueCommitDes")}</NoMarginHelperText>
            <FormControlLabel
              value="batch"
              control={<Radio size="small" />}
              label={t("policy.modelscopeBatchCommit")}
            />
            <NoMarginHelperText>{t("policy.modelscopeBatchCommitDes")}</NoMarginHelperText>
          </RadioGroup>
          <NoMarginHelperText>{t("policy.modelscopeCommitModeExclusive")}</NoMarginHelperText>
        </FormControl>
      </SettingForm>
      {mode === "queue" && (
        <Stack direction={"row"} spacing={2}>
          <SettingForm title={t("policy.modelscopeCommitIntervalMin")} lgWidth={lgWidth}>
            <DenseFilledTextField
              fullWidth
              type="number"
              value={settings?.modelscope_commit_interval_min ?? ""}
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: 1,
                },
              }}
              onChange={(e) =>
                onChange({
                  modelscope_commit_interval_min: e.target.value === "" ? undefined : parseInt(e.target.value),
                })
              }
            />
          </SettingForm>
          <SettingForm title={t("policy.modelscopeCommitIntervalMax")} lgWidth={lgWidth}>
            <DenseFilledTextField
              fullWidth
              type="number"
              value={settings?.modelscope_commit_interval_max ?? ""}
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: 1,
                },
              }}
              onChange={(e) =>
                onChange({
                  modelscope_commit_interval_max: e.target.value === "" ? undefined : parseInt(e.target.value),
                })
              }
            />
            <NoMarginHelperText>{t("policy.modelscopeCommitIntervalDes")}</NoMarginHelperText>
          </SettingForm>
        </Stack>
      )}
      {mode === "batch" && (
        <Stack direction={"row"} spacing={2}>
          <SettingForm title={t("policy.modelscopeBatchWindowMin")} lgWidth={lgWidth}>
            <DenseFilledTextField
              fullWidth
              type="number"
              value={settings?.modelscope_batch_window_min ?? ""}
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: 1,
                },
              }}
              onChange={(e) =>
                onChange({
                  modelscope_batch_window_min: e.target.value === "" ? undefined : parseInt(e.target.value),
                })
              }
            />
          </SettingForm>
          <SettingForm title={t("policy.modelscopeBatchWindowMax")} lgWidth={lgWidth}>
            <DenseFilledTextField
              fullWidth
              type="number"
              value={settings?.modelscope_batch_window_max ?? ""}
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: 1,
                },
              }}
              onChange={(e) =>
                onChange({
                  modelscope_batch_window_max: e.target.value === "" ? undefined : parseInt(e.target.value),
                })
              }
            />
            <NoMarginHelperText>{t("policy.modelscopeBatchWindowDes")}</NoMarginHelperText>
          </SettingForm>
        </Stack>
      )}
    </Stack>
  );
};

export default ModelScopeCommitMode;
