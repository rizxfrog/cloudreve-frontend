import { Button, FormControl, ListItemText, Stack } from "@mui/material";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StoragePolicy } from "../../../../../api/dashboard";
import { PolicyType } from "../../../../../api/explorer";
import { DenseFilledTextField, DenseSelect } from "../../../../Common/StyledComponents";
import SettingForm from "../../../../Pages/Setting/SettingForm";
import { SquareMenuItem } from "../../../../FileManager/ContextMenu/ContextMenu";
import { EndpointInput } from "../../../Common/EndpointInput";
import { NoMarginHelperText } from "../../../Settings/Settings";
import { AddWizardProps } from "../../AddWizardDialog";
import ModelScopeCommitMode from "./ModelScopeCommitMode";

const ModelScopeWizard = ({ onSubmit }: AddWizardProps) => {
  const { t } = useTranslation("dashboard");
  const formRef = useRef<HTMLFormElement>(null);
  const [policy, setPolicy] = useState<StoragePolicy>({
    id: 0,
    node_id: 0,
    name: "",
    type: PolicyType.modelscope,
    server: "https://www.modelscope.cn",
    is_private: true,
    dir_name_rule: "uploads/{uid}/{path}",
    file_name_rule: "{uuid}_{originname}",
    settings: {
      relay: true,
      // Downloads default to the relay: objects at or below the inline limit
      // live inside the repository and can only be read through this server.
      // Larger objects may be served straight from storage by turning this off.
      internal_proxy: true,
      chunk_size: 25 << 20,
      modelscope_repo_type: "datasets",
      modelscope_revision: "master",
      modelscope_namespace: "00",
    },
    edges: {},
  });

  const handleSubmit = () => {
    if (!formRef.current?.checkValidity()) {
      formRef.current?.reportValidity();
      return;
    }
    onSubmit(policy);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <SettingForm title={t("policy.name")} lgWidth={12}>
          <DenseFilledTextField
            fullWidth
            required
            value={policy.name}
            onChange={(e) => setPolicy({ ...policy, name: e.target.value })}
          />
          <NoMarginHelperText>{t("policy.policyName")}</NoMarginHelperText>
        </SettingForm>
        <SettingForm title={t("policy.modelscopeRepoId")} lgWidth={12}>
          <DenseFilledTextField
            placeholder="owner/repo"
            fullWidth
            required
            value={policy.bucket_name}
            onChange={(e) => setPolicy({ ...policy, bucket_name: e.target.value })}
          />
        </SettingForm>
        <SettingForm title={t("policy.policyEndpoint")} lgWidth={12}>
          <EndpointInput
            fullWidth
            required
            value={policy.server}
            enforceProtocol
            onChange={(e) => setPolicy({ ...policy, server: e.target.value })}
            variant={"outlined"}
          />
        </SettingForm>
        <SettingForm title={t("policy.modelscopeToken")} lgWidth={12}>
          <DenseFilledTextField
            type="password"
            fullWidth
            required
            value={policy.secret_key}
            onChange={(e) => setPolicy({ ...policy, secret_key: e.target.value })}
          />
          <NoMarginHelperText>{t("policy.modelscopeTokenDes")}</NoMarginHelperText>
        </SettingForm>
        <SettingForm title={t("policy.modelscopeRepoType")} lgWidth={12}>
          <FormControl fullWidth>
            <DenseSelect
              value={policy.settings?.modelscope_repo_type ?? "datasets"}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  settings: { ...policy.settings, modelscope_repo_type: e.target.value as string },
                })
              }
            >
              <SquareMenuItem value={"datasets"}>
                <ListItemText
                  slotProps={{
                    primary: { variant: "body2" },
                  }}
                >
                  datasets
                </ListItemText>
              </SquareMenuItem>
              <SquareMenuItem value={"models"}>
                <ListItemText
                  slotProps={{
                    primary: { variant: "body2" },
                  }}
                >
                  models
                </ListItemText>
              </SquareMenuItem>
            </DenseSelect>
          </FormControl>
        </SettingForm>
        <SettingForm title={t("policy.modelscopeNamespace")} lgWidth={12}>
          <DenseFilledTextField
            fullWidth
            required
            value={policy.settings?.modelscope_namespace ?? ""}
            inputProps={{ maxLength: 2, pattern: "[0-9]{2}" }}
            onChange={(e) =>
              setPolicy({
                ...policy,
                settings: { ...policy.settings, modelscope_namespace: e.target.value },
              })
            }
          />
        </SettingForm>
        <SettingForm title={t("policy.modelscopeRevision")} lgWidth={12}>
          <DenseFilledTextField
            fullWidth
            required
            value={policy.settings?.modelscope_revision ?? ""}
            onChange={(e) =>
              setPolicy({
                ...policy,
                settings: { ...policy.settings, modelscope_revision: e.target.value },
              })
            }
          />
        </SettingForm>
        <ModelScopeCommitMode
          lgWidth={12}
          settings={policy.settings}
          onChange={(patch) => setPolicy({ ...policy, settings: { ...policy.settings, ...patch } })}
        />
      </Stack>
      <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleSubmit}>
        {t("policy.create")}
      </Button>
    </form>
  );
};

export default ModelScopeWizard;
