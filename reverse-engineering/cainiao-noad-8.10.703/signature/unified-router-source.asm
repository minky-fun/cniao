; Fixed Mach-O SHA-256: d305a955a56094e30bc693249e455fdae9fd8ba04cc2ec66e573ca02bb0e5b61
; Selected instructions only. Addresses are unslid VM addresses.
; The initializer is not executed by the current bounded Unified probe.
0x102ba7ab8 adr x0, #0x102b9803c    ; code returns initializer address
0x102ba7ac8 ret
0x102b9803c sub sp, sp, #0x70
0x102b9805c mov x19, x0                 ; preserve caller-provided table pointer
0x102b980c4 cbz x19, #0x102b9816c     ; no installation for null input
0x102b98104 adrp x8, #0x1068fe000
0x102b98108 ldr x9, [x8, #0x200]       ; inspect 0x1068fe200
0x102b9810c cbnz x9, #0x102b9816c     ; existing table skips installation
0x102b98164 str x19, [x8, #0x200]      ; install caller-provided table
0x102b98168 bl #0x102b97dd8           ; continue registration
0x102b97e74 adrp x8, #0x1068fe000
0x102b97e78 ldr x20, [x8, #0x200]      ; registration reads installed table
0x102b97e80 ldr x8, [x20]              ; first table callback
0x102b97e90 mov w0, #2
0x102b97e94 mov w1, #0x13
0x102b97e98 mov w2, #2
0x102b97e9c mov w3, #1
0x102b97ea0 blr x8                      ; registers (2,19,2,1)
0x102ba98f8 ldr x8, [x22, #0x200]      ; later initializer requires table
0x102ba9900 mov w23, #1
0x102ba9958 ldr x19, [x22, #0x200]     ; current probe begins here
0x102ba9de8 strb w23, [x8, #0x5b8]    ; gate flag is set after other calls
0x102b9bb68 ldr x8, [x8, #0x200]       ; current error path sees null
0x102b9bb6c ldr x8, [x8, #8]           ; current fault at address 0x8
