"use client";

// Auto-submits its surrounding <form> on blur — pulled into its own
// Client Component because event handlers (onBlur) can't be attached
// directly to a plain <input>/<textarea> inside a Server Component;
// every other inline-edit field in this app (AssigneeSelect,
// DueDateInput, RecurrenceSelect) already follows this same pattern.
export function AutoSubmitField({
  name,
  defaultValue,
  placeholder,
  className,
  multiline = false,
  rows,
}: {
  name: string;
  defaultValue: string;
  placeholder?: string;
  className: string;
  multiline?: boolean;
  rows?: number;
}) {
  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.currentTarget.form?.requestSubmit();
  }

  if (multiline) {
    return (
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        placeholder={placeholder}
        onBlur={handleBlur}
        className={className}
      />
    );
  }

  return (
    <input
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onBlur={handleBlur}
      className={className}
    />
  );
}
