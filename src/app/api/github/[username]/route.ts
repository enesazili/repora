import { analyzePublicUser, GithubError } from "@/lib/github/service";

export async function GET(_request: Request, context: RouteContext<"/api/github/[username]">) {
  const { username } = await context.params;
  try {
    const result = await analyzePublicUser(username);
    return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } });
  } catch (error) {
    if (error instanceof GithubError) {
      return Response.json({ error: error.code }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("Unexpected public GitHub API error", error);
    return Response.json({ error: "upstream" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
