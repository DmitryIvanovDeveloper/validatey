import ResultEx from "../../../../infrastructure/result/result";

export class StartCommentsFetchUseCase {
  async execute(): Promise<ResultEx<{ status: "started"; mode: "native" }, Error>> {
    return ResultEx.success({ status: "started", mode: "native" });
  }

  async status(): Promise<ResultEx<{ status: "idle"; mode: "native" }, Error>> {
    return ResultEx.success({ status: "idle", mode: "native" });
  }
}
