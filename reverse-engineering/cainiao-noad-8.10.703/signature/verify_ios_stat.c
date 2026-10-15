/* 用 iPhoneOS arm64 SDK 编译，复核离线只读文件模型的 stat ABI。 */
#include <stddef.h>
#include <sys/stat.h>
_Static_assert(sizeof(struct stat) == 144, "stat size");
_Static_assert(offsetof(struct stat, st_mode) == 4, "mode offset");
_Static_assert(offsetof(struct stat, st_size) == 96, "size offset");
_Static_assert(offsetof(struct stat, st_blocks) == 104, "blocks offset");
_Static_assert(offsetof(struct stat, st_blksize) == 112, "block size offset");
