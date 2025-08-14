// components/blog/CommentForm.tsx (Create this new file and folder)
"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { postCommentAction } from "@/app/blog/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="mt-2">
      {pending ? "Posting..." : "Post Comment"}
    </Button>
  );
}

export function CommentForm({ postSlug }: { postSlug: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await postCommentAction(formData);
        formRef.current?.reset(); // Reset form after successful submission
      }}
      className="mt-6"
    >
      <input type="hidden" name="postSlug" value={postSlug} />
      <textarea
        name="content"
        required
        placeholder="Join the discussion..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={4}
      />
      <SubmitButton />
    </form>
  );
}