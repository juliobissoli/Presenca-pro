import { useRouter } from "next/router";
import * as React from "react";

export default function ClassRedirect() {
  const router = useRouter();
  const { classId } = router.query;

  React.useEffect(() => {
    if (classId) {
      router.replace(`/${classId}/marcacoes`);
    }
  }, [classId, router]);

  return null;
}
