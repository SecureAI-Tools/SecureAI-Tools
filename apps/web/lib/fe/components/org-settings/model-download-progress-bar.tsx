import { Progress } from "flowbite-react";

import { formatBytes } from "lib/core/bytes-utils";
import { PullModelProgressResponse } from "lib/types/api/model-pull-progress.response";

export default function ModelDownloadProgressBar({
  progress,
}: {
  progress: PullModelProgressResponse;
}) {
  if (!progress.digest) {
    // Ignore non-digest progress responses
    return null;
  }

  return (
    <>
      <Progress
        labelText
        progress={getProgressPercentage(progress)}
        size="sm"
        textLabel={getProgressLabel(progress)}
        textLabelPosition="outside"
      />
    </>
  );
}

const getProgressPercentage = ({
  completed,
  total,
}: PullModelProgressResponse): number => {
  if (!total || total === 0 || !completed) {
    return 0;
  }

  return round((completed * 100) / total);
};

const getProgressLabel = (progress: PullModelProgressResponse): string => {
  const progressPrecentage = getProgressPercentage(progress);

  return `${
    progressPrecentage === 100 ? "Downloaded" : "Downloading "
  } layer ${layerName(progress.digest)} (${formatBytes(
    progress.completed,
  )} / ${formatBytes(progress.total)})`;
};

const round = (n: number): number => {
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

const layerName = (digest: string | undefined): string => {
  if (!digest) {
    return "-";
  }
  const tokens = digest.split(":");
  return tokens.length > 1 ? tokens[1]!.substring(0, 12) : "-";
};
