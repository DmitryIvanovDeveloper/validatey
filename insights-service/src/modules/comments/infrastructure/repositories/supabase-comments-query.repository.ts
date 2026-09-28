import ResultEx from "../../../../infrastructure/result/result";
import { logger } from "../../../../infrastructure/logging/logger";
import { getSupabaseClient } from "../../../../infrastructure/database/supabase-client";
import type {
  CommentRecord,
  CommentsQueryRepositoryPort,
  PatternRecord,
  SuggestedOutreachRecord,
} from "../../application/ports/comments-query-repository.port";

function profileUrl(author: string, sourceType: "reddit" | "hackernews"): string {
  return sourceType === "hackernews"
    ? `https://news.ycombinator.com/user?id=${encodeURIComponent(author)}`
    : `https://www.reddit.com/user/${encodeURIComponent(author)}`;
}

export class SupabaseCommentsQueryRepository implements CommentsQueryRepositoryPort {
  async getById(id: string): Promise<ResultEx<CommentRecord | null, Error>> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("comments").select("*").eq("id", id).maybeSingle();
    if (error) return ResultEx.failure(new Error(error.message));
    return ResultEx.success((data as CommentRecord | null) ?? null);
  }

  async listByProject(input: {
    projectId: string;
    limit: number;
    sourceId?: string;
    periodMonths?: number;
  }): Promise<ResultEx<CommentRecord[], Error>> {
    const supabase = getSupabaseClient();
    let query = supabase.from("comments").select("*").eq("project_id", input.projectId).order("created_at", { ascending: false });
    if (input.sourceId) query = query.eq("source_id", input.sourceId);
    if (input.periodMonths && input.periodMonths > 0) {
      const from = new Date();
      from.setMonth(from.getMonth() - input.periodMonths);
      query = query.gte("created_at", from.toISOString());
    }
    const { data, error } = await query.limit(input.limit);
    if (error) return ResultEx.failure(new Error(error.message));
    return ResultEx.success(((data as CommentRecord[] | null) ?? []));
  }

  async getActivity(input: {
    projectId: string;
    bucket: "week" | "month";
    maxBuckets: number;
  }): Promise<ResultEx<Array<{ bucket: string; count: number }>, Error>> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("comments").select("created_at").eq("project_id", input.projectId).order("created_at", { ascending: true });
    if (error) return ResultEx.failure(new Error(error.message));
    const rows = (data as Array<{ created_at: string }> | null) ?? [];
    const counts = new Map<string, number>();
    for (const row of rows) {
      const at = new Date(row.created_at);
      const key =
        input.bucket === "month"
          ? `${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, "0")}`
          : (() => {
              const start = new Date(at);
              start.setUTCDate(start.getUTCDate() - start.getUTCDay());
              return `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-${String(start.getUTCDate()).padStart(2, "0")}`;
            })();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    let buckets = Array.from(counts.entries()).map(([bucket, count]) => ({ bucket, count })).sort((a, b) => a.bucket.localeCompare(b.bucket));
    if (input.maxBuckets > 0 && buckets.length > input.maxBuckets) buckets = buckets.slice(-input.maxBuckets);
    return ResultEx.success(buckets);
  }

  async getFreshness(projectId: string): Promise<
    ResultEx<{ oldestCommentAt: string; newestCommentAt: string; totalCount: number; isStale: boolean } | null, Error>
  > {
    const supabase = getSupabaseClient();
    const [oldestQ, newestQ, countQ] = await Promise.all([
      supabase.from("comments").select("created_at").eq("project_id", projectId).order("created_at", { ascending: true }).limit(1).maybeSingle(),
      supabase.from("comments").select("created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("comments").select("*", { count: "exact", head: true }).eq("project_id", projectId),
    ]);
    if (oldestQ.error) return ResultEx.failure(new Error(oldestQ.error.message));
    if (newestQ.error) return ResultEx.failure(new Error(newestQ.error.message));
    if (countQ.error) return ResultEx.failure(new Error(countQ.error.message));
    if (!oldestQ.data || !newestQ.data) return ResultEx.success(null);
    const newest = new Date((newestQ.data as { created_at: string }).created_at);
    const staleThreshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return ResultEx.success({
      oldestCommentAt: new Date((oldestQ.data as { created_at: string }).created_at).toISOString(),
      newestCommentAt: newest.toISOString(),
      totalCount: countQ.count ?? 0,
      isStale: newest.getTime() < staleThreshold,
    });
  }

  async getPatternAnalysis(projectId: string): Promise<ResultEx<PatternRecord, Error>> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("research_data").select("comment_pattern_analysis").eq("project_id", projectId).maybeSingle();
    if (error) return ResultEx.failure(new Error(error.message));
    const analysis = (data?.comment_pattern_analysis as PatternRecord | null) ?? null;
    if (!analysis || !Array.isArray(analysis.patterns) || analysis.patterns.length === 0) {
      return ResultEx.failure(new Error('Pattern analysis not available. Please run "Start Research" first.'));
    }
    const patterns = [...(analysis.patterns as Array<{ count?: number }>)].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    return ResultEx.success({ ...analysis, patterns });
  }

  async getSuggestedOutreach(projectId: string, limit: number): Promise<ResultEx<SuggestedOutreachRecord[], Error>> {
    const supabase = getSupabaseClient();
    const [researchQ, commentsQ, sourcesQ] = await Promise.all([
      supabase.from("research_data").select("comment_pattern_analysis").eq("project_id", projectId).maybeSingle(),
      supabase.from("comments").select("id,source_id,author,context_url,url,created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(5000),
      supabase.from("comment_sources").select("id,source_type").eq("project_id", projectId),
    ]);
    if (researchQ.error) return ResultEx.failure(new Error(researchQ.error.message));
    if (commentsQ.error) return ResultEx.failure(new Error(commentsQ.error.message));
    if (sourcesQ.error) return ResultEx.failure(new Error(sourcesQ.error.message));

    const patterns = ((researchQ.data?.comment_pattern_analysis as { patterns?: Array<{ supportsHypothesis?: boolean; commentIds?: string[] }> } | null)?.patterns) ?? [];
    const supportingIds = new Set<string>();
    patterns.forEach((p) => p.supportsHypothesis && p.commentIds?.forEach((id) => id && supportingIds.add(id)));
    if (supportingIds.size === 0) return ResultEx.success([]);

    const sourceTypeById = new Map<string, "reddit" | "hackernews">();
    (((sourcesQ.data as Array<{ id: string; source_type: "reddit" | "hackernews" }> | null) ?? [])).forEach((s) => sourceTypeById.set(s.id, s.source_type));
    const rows = (commentsQ.data as Array<{ id: string; source_id: string; author: string | null; context_url: string | null; url: string; created_at: string }> | null) ?? [];

    const agg = new Map<string, { author: string; sourceType: "reddit" | "hackernews"; commentCount: number; supportingCount: number; last: string }>();
    for (const row of rows) {
      const author = row.author?.trim();
      if (!author) continue;
      let sourceType = sourceTypeById.get(row.source_id) ?? "reddit";
      const url = (row.context_url || row.url || "").toLowerCase();
      if (url.includes("ycombinator.com") || url.includes("news.ycombinator.com")) sourceType = "hackernews";
      const key = `${author}\n${sourceType}`;
      const item = agg.get(key) ?? { author, sourceType, commentCount: 0, supportingCount: 0, last: row.created_at };
      item.commentCount += 1;
      if (supportingIds.has(row.id)) item.supportingCount += 1;
      if (new Date(row.created_at).getTime() > new Date(item.last).getTime()) item.last = row.created_at;
      agg.set(key, item);
    }
    const commenters = Array.from(agg.values())
      .filter((x) => x.supportingCount > 0)
      .sort((a, b) => b.supportingCount - a.supportingCount || new Date(b.last).getTime() - new Date(a.last).getTime())
      .slice(0, Math.max(1, Math.min(limit, 100)))
      .map((x) => ({
        author: x.author,
        sourceType: x.sourceType,
        commentCount: x.commentCount,
        supportingCount: x.supportingCount,
        lastCommentAt: new Date(x.last).toISOString(),
        profileUrl: profileUrl(x.author, x.sourceType),
      }));
    return ResultEx.success(commenters);
  }

  async getByAuthor(input: {
    projectId: string;
    author: string;
    sourceType?: "reddit" | "hackernews";
    limit: number;
  }): Promise<ResultEx<CommentRecord[], Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("project_id", input.projectId)
        .eq("author", input.author.trim())
        .order("created_at", { ascending: false })
        .limit(input.limit);
      if (error) return ResultEx.failure(new Error(error.message));

      const rows = (data as CommentRecord[] | null) ?? [];
      if (!input.sourceType) return ResultEx.success(rows);

      const filtered = rows.filter((row) => {
        const url = String(row["context_url"] ?? row["url"] ?? "").toLowerCase();
        const inferred = url.includes("ycombinator.com") || url.includes("news.ycombinator.com") ? "hackernews" : "reddit";
        return inferred === input.sourceType;
      });
      return ResultEx.success(filtered);
    } catch (error) {
      logger.error("comments.query.by-author.exception", { input, error });
      return ResultEx.failure(error instanceof Error ? error : new Error("Unknown error"));
    }
  }

  async createSource(input: {
    projectId: string;
    sourceType: "reddit" | "hackernews";
    redditUrl?: string;
    hnUrl?: string;
    hnFeedType?: string;
    postId?: string;
    subredditName?: string;
    hnItemId?: string;
  }): Promise<ResultEx<CommentRecord, Error>> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("comment_sources")
      .insert({
        project_id: input.projectId,
        source_type: input.sourceType,
        reddit_url: input.redditUrl ?? null,
        hn_url: input.hnUrl ?? null,
        hn_feed_type: input.hnFeedType ?? null,
        post_id: input.postId ?? null,
        subreddit_name: input.subredditName ?? null,
        hn_item_id: input.hnItemId ?? null,
      })
      .select("*")
      .single();
    if (error) return ResultEx.failure(new Error(error.message));
    return ResultEx.success((data as CommentRecord) ?? {});
  }

  async listSources(projectId: string): Promise<ResultEx<CommentRecord[], Error>> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("comment_sources")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) return ResultEx.failure(new Error(error.message));
    return ResultEx.success((data as CommentRecord[] | null) ?? []);
  }

  async deleteSource(projectId: string, sourceId: string): Promise<ResultEx<boolean, Error>> {
    const supabase = getSupabaseClient();
    const { error, count } = await supabase
      .from("comment_sources")
      .delete({ count: "exact" })
      .eq("project_id", projectId)
      .eq("id", sourceId);
    if (error) return ResultEx.failure(new Error(error.message));
    return ResultEx.success((count ?? 0) > 0);
  }

  async listPatternComments(input: {
    projectId: string;
    patternType: string;
    patternIndex?: number;
    commentIdsFromQuery?: string[];
  }): Promise<ResultEx<{ comments: CommentRecord[]; pattern: PatternRecord | null }, Error>> {
    const supabase = getSupabaseClient();
    const { data: researchData, error: researchError } = await supabase
      .from("research_data")
      .select("comment_pattern_analysis")
      .eq("project_id", input.projectId)
      .maybeSingle();
    if (researchError) return ResultEx.failure(new Error(researchError.message));

    const patterns =
      ((researchData?.comment_pattern_analysis as { patterns?: Array<Record<string, unknown>> } | null)?.patterns as
        | Array<Record<string, unknown>>
        | undefined) ?? [];
    const matched = patterns.filter((p) => String(p.type ?? "") === input.patternType);
    const index = input.patternIndex != null && input.patternIndex >= 0 ? input.patternIndex : 0;
    const pattern = matched[index] ?? null;

    const idsFromPattern =
      pattern && Array.isArray(pattern.commentIds)
        ? pattern.commentIds.filter((id): id is string => typeof id === "string" && id.length > 0)
        : [];
    const ids = input.commentIdsFromQuery && input.commentIdsFromQuery.length > 0 ? input.commentIdsFromQuery : idsFromPattern;
    if (ids.length === 0) return ResultEx.success({ comments: [], pattern: pattern as PatternRecord | null });

    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("*")
      .eq("project_id", input.projectId)
      .in("id", ids);
    if (commentsError) return ResultEx.failure(new Error(commentsError.message));

    return ResultEx.success({
      comments: (comments as CommentRecord[] | null) ?? [],
      pattern: pattern as PatternRecord | null,
    });
  }
}
