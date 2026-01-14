import {
  type ConfirmOptions,
  cancel,
  confirm,
  isCancel,
  multiselect,
  select,
  type TextOptions,
  text,
} from "@clack/prompts";

export const CANCEL_MESSAGE = "Operation cancelled.";

export async function enhancedConfirm(
  opts: ConfirmOptions,
  cancelMessage = CANCEL_MESSAGE
) {
  const result = await confirm(opts);
  if (isCancel(result)) {
    cancel(cancelMessage);
    process.exit(0);
  }
  return result;
}

type Primitive = Readonly<string | boolean | number>;
type Option<Value> = Value extends Primitive
  ? {
      value: Value;
      label?: string;
      hint?: string;
    }
  : {
      value: Value;
      label: string;
      hint?: string;
    };
interface SelectOptions<Options extends Option<Value>[], Value> {
  message: string;
  options: Options;
  initialValue?: Options[number]["value"];
  maxItems?: number;
}

export async function enhancedSelect<
  const Options extends Option<Value>[],
  const Value,
>(
  opts: SelectOptions<Options, Value>,
  cancelMessage = CANCEL_MESSAGE
): Promise<Options[number]["value"]> {
  const result = await select(opts);
  if (isCancel(result)) {
    cancel(cancelMessage);
    process.exit(0);
  }
  return result;
}

interface MultiSelectOptions<Value> {
  message: string;
  options: Option<Value>[];
  initialValues?: Value[];
  required?: boolean;
  cursorAt?: Value;
}

export async function enhancedMultiselect<const Value>(
  opts: MultiSelectOptions<Value>,
  cancelMessage = CANCEL_MESSAGE
): Promise<Value[]> {
  const result = await multiselect(opts);
  if (isCancel(result)) {
    cancel(cancelMessage);
    process.exit(0);
  }
  return result;
}

export async function enhancedText(
  opts: TextOptions,
  cancelMessage = CANCEL_MESSAGE
) {
  const result = await text({
    ...opts,
    placeholder: opts.placeholder ?? opts.defaultValue,
  });
  if (isCancel(result)) {
    cancel(cancelMessage);
    process.exit(0);
  }
  return result;
}
