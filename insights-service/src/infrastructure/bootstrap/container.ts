import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types";
import { logger } from "../logging/logger";
import { bindResearch } from "../../modules/research/infrastructure/bootstrap/bind.research";
import { bindComments } from "../../modules/comments/infrastructure/bootstrap/bind.comments";
import { bindSignals } from "../../modules/signals/infrastructure/bootstrap/bind.signals";
import { bindScraper } from "../../modules/scraper/infrastructure/bootstrap/bind.scraper";

const container = new Container();

// Root bindings
container.bind(TYPES.Logger).toConstantValue(logger);
// Module bindings
bindResearch(container);
bindComments(container);
bindSignals(container);
bindScraper(container);

export { container };
