; Fixed Mach-O SHA-256: d305a955a56094e30bc693249e455fdae9fd8ba04cc2ec66e573ca02bb0e5b61
; Selected instructions only. Addresses are unslid VM addresses.
0x102b9ac48 bl #0x104431844              ; [One respondsToSelector:]
0x102b9ac60 bl #0x104431844              ; [One methodForSelector:]
0x102b9ac74 blr x8                        ; +play: IMP 0x102b8632c
0x102b863c4 adrp x8, #0x1066a3000
0x102b863c8 ldr x8, [x8, #0x300]         ; initialized image pointer 0x102b878e4
0x102b863d8 blr x8
0x102b879a0 ldr x8, [x24, #0xff0]        ; 0x1068fdff0, installed by 0x102b87b04
0x102b879a4 cbz x8, #0x102b87a64
0x102b879c0 mov w1, #0x17
0x102b879c4 mov w2, #0x12
0x102b879d0 blr x8                        ; (2,23,18,0)
0x102b879d4 cbz x0, #0x102b87a6c
0x102ba9ba4 mov w1, #0x17
0x102ba9ba8 mov w2, #0x18
0x102ba9bb0 blr x8                        ; registers (2,23,24,0)
0x102ba9bc0 bl #0x102b87aac              ; installs 0x1068fdff0
0x102ba96b0 adrp x8, #0x1069c1000       ; handler for (2,23,18,0)
0x102ba96b4 ldrb w0, [x8, #0x5b8]
0x102ba96b8 ret
0x102ba9900 mov w23, #1                   ; same initialization function
0x102ba9de4 adrp x8, #0x1069c1000
0x102ba9de8 strb w23, [x8, #0x5b8]      ; later initialization step, not executed in slice
0x102b9bb68 ldr x8, [x8, #0x200]         ; 0x1068fe200 is zero in current slice
0x102b9bb6c ldr x8, [x8, #8]            ; fault address 0x8
