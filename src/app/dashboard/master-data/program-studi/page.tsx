import { connection } from "next/server";

import { listStudyPrograms } from "@/lib/admin/study-programs";
import { requireAuthorizedUser } from "@/lib/auth";
import { StudyProgramsManager } from "@/modules/master-data/study-programs-manager";

type ProgramStudiPageProps = {
  searchParams?: Promise<{
    q?: string;
    page?: string;
  }>;
};

export default async function ProgramStudiPage({ searchParams }: ProgramStudiPageProps) {
  await connection();

  await requireAuthorizedUser("master-data.program-studi");
  const params = await searchParams;
  const page = Number(params?.page ?? "1");
  const data = await listStudyPrograms({
    query: params?.q,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: 10,
  });

  return <StudyProgramsManager {...data} />;
}
