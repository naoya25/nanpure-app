import { HeartIcon } from "@/components/icons/heart-icon";

type LikeButtonProps = {
  liked: boolean;
  onToggle: () => void;
  /** 保存に失敗したときなどの案内。無ければ `null` */
  message: string | null;
};

/** 問題のいいね（端末に保存して、あとで「いいねした問題」から開ける） */
export function LikeButton({ liked, onToggle, message }: LikeButtonProps) {
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={liked}
        title={liked ? "いいねを外す" : "この問題をいいねして保存する"}
        className={[
          "inline-flex min-h-11 touch-manipulation items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors",
          liked
            ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
            : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50",
        ].join(" ")}
      >
        <HeartIcon className="h-4 w-4" filled={liked} />
        {liked ? "いいね済み" : "いいね"}
      </button>
      {message ? (
        <span role="status" className="text-xs text-rose-700">
          {message}
        </span>
      ) : null}
    </span>
  );
}
