export type ToastRedirectInput = {
  variant: "success" | "error" | "info";
  title: string;
  message?: string;
};

export function withToastParams(url: string, input: ToastRedirectInput) {
  const [path, query = ""] = url.split("?");
  const params = new URLSearchParams(query);

  params.set("toast", "1");
  params.set("toastVariant", input.variant);
  params.set("toastTitle", input.title);

  if (input.message) {
    params.set("toastMessage", input.message);
  } else {
    params.delete("toastMessage");
  }

  const nextQuery = params.toString();
  return nextQuery ? `${path}?${nextQuery}` : path;
}
