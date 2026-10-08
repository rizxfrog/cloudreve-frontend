import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  DialogContent,
  Divider,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { getGroupList, previewBulkMailRecipients, sendBulkMail } from "../../../api/api";
import type { BulkMailRecipientPreview, GroupEnt } from "../../../api/dashboard";
import { UserStatus } from "../../../api/dashboard";
import { useAppDispatch } from "../../../redux/hooks";
import CircularProgress from "../../Common/CircularProgress";
import { DenseFilledTextField, NoWrapTableCell, SecondaryButton } from "../../Common/StyledComponents";
import DraggableDialog, { StyledDialogContentText } from "../../Dialogs/DraggableDialog";
import MailOutlined from "../../Icons/MailOutlined";
import PageContainer from "../../Pages/PageContainer";
import PageHeader from "../../Pages/PageHeader";
import SettingForm from "../../Pages/Setting/SettingForm";
import { BorderedCard } from "../Common/AdminCard";
import MagicVarDialog from "../Common/MagicVarDialog";
import type { MagicVar } from "../Common/MagicVarDialog";

const MonacoEditor = lazy(() => import("../../Viewers/CodeViewer/MonacoEditor"));

// The placeholders a message may reference, mirroring the server's render
// context. Kept in sync with email.BulkMailVariables.
const bulkMailVariables: MagicVar[] = [
  { name: "{{ .SiteBasic.Name }}", value: "bulkMail.varSiteName", example: "Cloudreve" },
  { name: "{{ .SiteBasic.Title }}", value: "bulkMail.varSiteTitle", example: "Cloudreve" },
  { name: "{{ .SiteBasic.Description }}", value: "bulkMail.varSiteDescription", example: "Self hosted cloud" },
  { name: "{{ .SiteUrl }}", value: "bulkMail.varSiteUrl", example: "https://cloudreve.org" },
  { name: "{{ .Logo.Normal }}", value: "bulkMail.varLogoNormal", example: "https://.../logo.svg" },
  { name: "{{ .Logo.Light }}", value: "bulkMail.varLogoLight", example: "https://.../logo_light.svg" },
  { name: "{{ .User.Nick }}", value: "bulkMail.varUserNick", example: "Alice" },
  { name: "{{ .User.Email }}", value: "bulkMail.varUserEmail", example: "alice@example.com" },
];

// A preview is debounced so typing in a filter does not issue a request per
// keystroke.
const previewDebounceMs = 400;
// The default editor height leaves room for the preview below it.
const bodyEditorHeight = 320;

const BulkMail = () => {
  const { t } = useTranslation("dashboard");
  const dispatch = useAppDispatch();

  const [groups, setGroups] = useState<number[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [nick, setNick] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [suffixInput, setSuffixInput] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [allGroups, setAllGroups] = useState<GroupEnt[]>([]);
  const [preview, setPreview] = useState<BulkMailRecipientPreview>();
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string>();
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sent, setSent] = useState<{ taskID: string; recipients: number }>();
  const [varOpen, setVarOpen] = useState(false);

  const filterRequest = useMemo(
    () => ({
      groups: groups.length > 0 ? groups : undefined,
      statuses: statuses.length > 0 ? statuses : undefined,
      nick: nick.trim() || undefined,
      email: emailFilter.trim() || undefined,
      email_suffixes: suffixInput.length > 0 ? suffixInput : undefined,
    }),
    [groups, statuses, nick, emailFilter, suffixInput],
  );

  useEffect(() => {
    dispatch(getGroupList({ page_size: 1000, page: 1, order_by: "id", order_direction: "asc" })).then((res) => {
      setAllGroups(res.groups);
    });
  }, [dispatch]);

  // The recipient count drives a confirmation, so it must reflect the filter
  // currently on screen. A stale count would confirm the wrong audience.
  useEffect(() => {
    setPreviewError(undefined);
    setSent(undefined);
    setPreviewing(true);

    const timer = setTimeout(() => {
      dispatch(previewBulkMailRecipients(filterRequest))
        .then((res) => {
          setPreview(res);
        })
        .catch((e: Error) => {
          setPreview(undefined);
          setPreviewError(e.message);
        })
        .finally(() => {
          setPreviewing(false);
        });
    }, previewDebounceMs);

    return () => clearTimeout(timer);
  }, [dispatch, filterRequest]);

  const recipientCount = preview?.count ?? 0;
  const deliverableCount = recipientCount - (preview?.undeliverable ?? 0);
  const canSend = !!title.trim() && !!body.trim() && deliverableCount > 0 && !sending;

  const handleSend = useCallback(() => {
    setSending(true);
    dispatch(
      sendBulkMail({
        ...filterRequest,
        title: title.trim(),
        body,
        confirm_recipients: recipientCount,
      }),
    )
      .then((res) => {
        setSent({ taskID: res.task_id, recipients: res.recipients });
        setConfirmOpen(false);
      })
      .catch(() => {
        // Errors surface through the shared snackbar.
      })
      .finally(() => {
        setSending(false);
      });
  }, [dispatch, filterRequest, title, body, recipientCount]);

  return (
    <PageContainer>
      <MagicVarDialog open={varOpen} onClose={() => setVarOpen(false)} vars={bulkMailVariables} />
      <DraggableDialog
        dialogProps={{ open: confirmOpen, onClose: () => setConfirmOpen(false) }}
        loading={sending}
        showActions
        showCancel
        onAccept={handleSend}
        okText={t("bulkMail.confirmSend")}
        title={t("bulkMail.confirmTitle")}
      >
        <DialogContent>
          <StyledDialogContentText sx={{ mb: 1 }}>
            <Trans
              ns="dashboard"
              i18nKey="bulkMail.confirmMessage"
              values={{ count: deliverableCount }}
              components={[<strong key={0} />]}
            />
          </StyledDialogContentText>
          {preview && preview.undeliverable > 0 && (
            <Alert severity="info">{t("bulkMail.undeliverableNotice", { count: preview.undeliverable })}</Alert>
          )}
          <StyledDialogContentText sx={{ mt: 2, fontWeight: 600 }}>{title}</StyledDialogContentText>
        </DialogContent>
      </DraggableDialog>

      <Container maxWidth="lg">
        <PageHeader title={t("bulkMail.title")} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t("bulkMail.description")}
        </Typography>

        {sent && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            action={
              <Button component={RouterLink} to="/admin/task" size="small">
                {t("bulkMail.viewTask")}
              </Button>
            }
          >
            {t("bulkMail.queuedNotice", { count: sent.recipients })}
          </Alert>
        )}

        <Stack spacing={3}>
          <BorderedCard>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {t("bulkMail.recipients")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("bulkMail.recipientsDes")}
            </Typography>

            <Stack spacing={2}>
              <SettingForm title={t("bulkMail.filterGroups")} lgWidth={12}>
                <Autocomplete
                  multiple
                  options={allGroups.filter((g) => g.id !== 3).map((g) => g.id)}
                  getOptionLabel={(id) => allGroups.find((g) => g.id === id)?.name ?? id.toString()}
                  value={groups}
                  onChange={(_, value) => setGroups(value)}
                  renderInput={(params) => <TextField {...params} size="small" placeholder={t("bulkMail.allGroups")} />}
                />
              </SettingForm>

              <SettingForm title={t("bulkMail.filterStatuses")} lgWidth={12}>
                <Autocomplete
                  multiple
                  options={Object.values(UserStatus)}
                  getOptionLabel={(status) => t(`user.status_${status}`)}
                  value={statuses}
                  onChange={(_, value) => setStatuses(value)}
                  renderInput={(params) => (
                    <TextField {...params} size="small" placeholder={t("bulkMail.allStatuses")} />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((status, index) => (
                      <Chip size="small" label={t(`user.status_${status}`)} {...getTagProps({ index })} />
                    ))
                  }
                />
              </SettingForm>

              <SettingForm title={t("bulkMail.filterNick")} lgWidth={12}>
                <DenseFilledTextField
                  fullWidth
                  size="small"
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  placeholder={t("bulkMail.nickPlaceholder")}
                />
              </SettingForm>

              <SettingForm title={t("bulkMail.filterEmail")} lgWidth={12}>
                <DenseFilledTextField
                  fullWidth
                  size="small"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  placeholder={t("bulkMail.emailPlaceholder")}
                />
              </SettingForm>

              <SettingForm title={t("bulkMail.filterSuffixes")} lgWidth={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[] as string[]}
                  value={suffixInput}
                  onChange={(_, value) => setSuffixInput(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder={t("bulkMail.suffixPlaceholder")}
                      helperText={t("bulkMail.suffixHelper")}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((suffix, index) => <Chip size="small" label={suffix} {...getTagProps({ index })} />)
                  }
                />
              </SettingForm>
            </Stack>
          </BorderedCard>

          <BorderedCard>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={600}>
                {t("bulkMail.audience")}
              </Typography>
              {previewing && <CircularProgress size={18} />}
            </Stack>

            {previewError ? (
              <Alert severity="error" sx={{ mt: 1 }}>
                {previewError}
              </Alert>
            ) : (
              <>
                <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                  <Box>
                    <Typography variant="h5" fontWeight={600}>
                      {recipientCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("bulkMail.matched")}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      fontWeight={600}
                      color={deliverableCount > 0 ? "primary" : "text.disabled"}
                    >
                      {deliverableCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("bulkMail.willReceive")}
                    </Typography>
                  </Box>
                  {(preview?.undeliverable ?? 0) > 0 && (
                    <Box>
                      <Typography variant="h5" fontWeight={600} color="warning.main">
                        {preview?.undeliverable}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("bulkMail.skipped")}
                      </Typography>
                    </Box>
                  )}
                </Stack>

                {recipientCount === 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    {t("bulkMail.noRecipients")}
                  </Alert>
                )}

                {(preview?.sample?.length ?? 0) > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" color="text.secondary">
                      {t("bulkMail.sample", { count: preview?.sample?.length })}
                    </Typography>
                    <TableContainer sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <NoWrapTableCell>{t("bulkMail.sampleNick")}</NoWrapTableCell>
                            <NoWrapTableCell>{t("bulkMail.sampleEmail")}</NoWrapTableCell>
                            <NoWrapTableCell>{t("bulkMail.sampleGroup")}</NoWrapTableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {preview?.sample?.map((r) => (
                            <TableRow key={r.id} hover>
                              <TableCell>
                                <Link component={RouterLink} to={`/admin/user?email=${encodeURIComponent(r.email)}`}>
                                  {r.nick}
                                </Link>
                              </TableCell>
                              <TableCell>{r.email}</TableCell>
                              <TableCell>{r.group || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </>
            )}
          </BorderedCard>

          <BorderedCard>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {t("bulkMail.message")}
              </Typography>
              <SecondaryButton size="small" onClick={() => setVarOpen(true)}>
                {t("bulkMail.variables")}
              </SecondaryButton>
            </Stack>

            <Stack spacing={2}>
              <SettingForm title={t("bulkMail.subject")} lgWidth={12}>
                <DenseFilledTextField
                  fullWidth
                  size="small"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("bulkMail.subjectPlaceholder")}
                  inputProps={{ maxLength: 255 }}
                />
              </SettingForm>

              <SettingForm title={t("bulkMail.body")} lgWidth={12}>
                <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
                  <Suspense fallback={<CircularProgress size={24} sx={{ m: 2 }} />}>
                    <MonacoEditor
                      height={bodyEditorHeight}
                      language="html"
                      value={body}
                      onChange={(value) => setBody(value ?? "")}
                      options={{
                        minimap: { enabled: false },
                        wordWrap: "on",
                        fontSize: 13,
                        lineNumbers: "off",
                        scrollBeyondLastLine: false,
                      }}
                    />
                  </Suspense>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {t("bulkMail.bodyHelper")}
                </Typography>
              </SettingForm>
            </Stack>
          </BorderedCard>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={<MailOutlined />}
              disabled={!canSend}
              onClick={() => setConfirmOpen(true)}
            >
              {t("bulkMail.send")}
            </Button>
          </Box>
        </Stack>
      </Container>
    </PageContainer>
  );
};

export default BulkMail;
