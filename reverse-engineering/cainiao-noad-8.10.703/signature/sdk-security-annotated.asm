
Cainiao4iPhone: file format mach-o arm64

Disassembly of section __TEXT,__text:

00000001023e5330 <___cxa_throw>:
; TBSDKSecurity sign:input:
102813564: d102c3ff    	sub	sp, sp, #0xb0
102813568: a9056ffc    	stp	x28, x27, [sp, #0x50]
10281356c: a90667fa    	stp	x26, x25, [sp, #0x60]
102813570: a9075ff8    	stp	x24, x23, [sp, #0x70]
102813574: a90857f6    	stp	x22, x21, [sp, #0x80]
102813578: a9094ff4    	stp	x20, x19, [sp, #0x90]
10281357c: a90a7bfd    	stp	x29, x30, [sp, #0xa0]
102813580: 910283fd    	add	x29, sp, #0xa0
102813584: aa0303f4    	mov	x20, x3
102813588: aa0003f3    	mov	x19, x0
10281358c: aa0203e0    	mov	x0, x2
102813590: 947078ce    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102813594: aa0003fb    	mov	x27, x0
102813598: aa1403e0    	mov	x0, x20
10281359c: 947078cb    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
1028135a0: aa0003f4    	mov	x20, x0
1028135a4: f001d1e8    	adrp	x8, 0x106252000 <dyld_stub_binder+0x106252000>
1028135a8: f944ed01    	ldr	x1, [x8, #0x9d8] ; selector: middleTier
1028135ac: aa1303e0    	mov	x0, x19
1028135b0: 947078a5    	bl	0x104431844 <dyld_stub_binder+0x104431844>
1028135b4: aa1d03fd    	mov	x29, x29
1028135b8: 947078cd    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
1028135bc: aa0003f5    	mov	x21, x0
1028135c0: b4000ce0    	cbz	x0, 0x10281375c <___cxa_throw+0x42e42c>
1028135c4: 9001d508    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
1028135c8: f942a516    	ldr	x22, [x8, #0x548]
1028135cc: d001d0a8    	adrp	x8, 0x106229000 <dyld_stub_binder+0x106229000>
1028135d0: f9442501    	ldr	x1, [x8, #0x848] ; selector: envMapToSecurityGuardEnv
1028135d4: aa1303e0    	mov	x0, x19
1028135d8: 9470789b    	bl	0x104431844 <dyld_stub_binder+0x104431844>
1028135dc: 93407c02    	sxtw	x2, w0
1028135e0: 9001d228    	adrp	x8, 0x106257000 <dyld_stub_binder+0x106257000>
1028135e4: f9402901    	ldr	x1, [x8, #0x50] ; selector: numberWithInteger:
1028135e8: aa1603e0    	mov	x0, x22
1028135ec: 94707896    	bl	0x104431844 <dyld_stub_binder+0x104431844>
1028135f0: aa1d03fd    	mov	x29, x29
1028135f4: 947078be    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
1028135f8: aa0003f6    	mov	x22, x0
1028135fc: 9001d068    	adrp	x8, 0x10621f000 <dyld_stub_binder+0x10621f000>
102813600: f947d501    	ldr	x1, [x8, #0xfa8] ; selector: dataUsingEncoding:
102813604: aa1403e0    	mov	x0, x20
102813608: 52800082    	mov	w2, #0x4                ; =4
10281360c: 9470788e    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813610: aa1d03fd    	mov	x29, x29
102813614: 947078b6    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102813618: aa0003f7    	mov	x23, x0
10281361c: 9001d508    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102813620: f9429500    	ldr	x0, [x8, #0x528]
102813624: 94707834    	bl	0x1044316f4 <dyld_stub_binder+0x1044316f4>
102813628: b001d168    	adrp	x8, 0x106240000 <dyld_stub_binder+0x106240000>
10281362c: f941a901    	ldr	x1, [x8, #0x350] ; selector: initWithObjectsAndKeys:
102813630: b00170e8    	adrp	x8, 0x105630000 <dyld_stub_binder+0x105630000>
102813634: 91146108    	add	x8, x8, #0x518 ; env
102813638: a9027fe8    	stp	x8, xzr, [sp, #0x20]
10281363c: b0016e28    	adrp	x8, 0x1055d8000 <dyld_stub_binder+0x1055d8000>
102813640: 912a6108    	add	x8, x8, #0xa98 ; data
102813644: 90016ec9    	adrp	x9, 0x1055eb000 <dyld_stub_binder+0x1055eb000>
102813648: 911f6129    	add	x9, x9, #0x7d8 ; appkey
10281364c: a9015be8    	stp	x8, x22, [sp, #0x10]
102813650: a9005fe9    	stp	x9, x23, [sp]
102813654: aa1b03e2    	mov	x2, x27
102813658: 9470787b    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281365c: aa0003f8    	mov	x24, x0
102813660: f90027ff    	str	xzr, [sp, #0x48]
102813664: d001d108    	adrp	x8, 0x106235000 <dyld_stub_binder+0x106235000>
102813668: f9416901    	ldr	x1, [x8, #0x2d0] ; selector: getSign:error:
10281366c: 910123e3    	add	x3, sp, #0x48
102813670: aa1503e0    	mov	x0, x21
102813674: aa1803e2    	mov	x2, x24
102813678: 94707873    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281367c: aa1d03fd    	mov	x29, x29
102813680: 9470789b    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102813684: aa0003f9    	mov	x25, x0
102813688: f94027e0    	ldr	x0, [sp, #0x48]
10281368c: 9470788f    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102813690: aa0003fa    	mov	x26, x0
102813694: f90023fb    	str	x27, [sp, #0x40]
102813698: b40009f9    	cbz	x25, 0x1028137d4 <___cxa_throw+0x42e4a4>
10281369c: f9001ff6    	str	x22, [sp, #0x38]
1028136a0: 9001d228    	adrp	x8, 0x106257000 <dyld_stub_binder+0x106257000>
1028136a4: f941d501    	ldr	x1, [x8, #0x3a8] ; selector: objectForKey:
1028136a8: f00178a2    	adrp	x2, 0x10572a000 <dyld_stub_binder+0x10572a000>
1028136ac: 9118e042    	add	x2, x2, #0x638 ; x-sign
1028136b0: aa1903e0    	mov	x0, x25
1028136b4: 94707864    	bl	0x104431844 <dyld_stub_binder+0x104431844>
1028136b8: aa1d03fd    	mov	x29, x29
1028136bc: 9470788c    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
1028136c0: aa0003fb    	mov	x27, x0
1028136c4: 9001d1c8    	adrp	x8, 0x10624b000 <dyld_stub_binder+0x10624b000>
1028136c8: f944e901    	ldr	x1, [x8, #0x9d0] ; selector: length
1028136cc: 9470785e    	bl	0x104431844 <dyld_stub_binder+0x104431844>
1028136d0: aa0003f6    	mov	x22, x0
1028136d4: 9001d568    	adrp	x8, 0x1062bf000 <dyld_stub_binder+0x1062bf000>
1028136d8: f9412513    	ldr	x19, [x8, #0x248]
1028136dc: d503201f    	nop
1028136e0: f9418d00    	ldr	x0, [x8, #0x318]
1028136e4: 9001cf88    	adrp	x8, 0x106203000 <dyld_stub_binder+0x106203000>
1028136e8: f9472101    	ldr	x1, [x8, #0xe40] ; selector: activeSpan
1028136ec: 94707856    	bl	0x104431844 <dyld_stub_binder+0x104431844>
1028136f0: aa1d03fd    	mov	x29, x29
1028136f4: 9470787e    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
1028136f8: aa0003fc    	mov	x28, x0
1028136fc: d001d448    	adrp	x8, 0x10629d000 <dyld_stub_binder+0x10629d000>
102813700: f9447501    	ldr	x1, [x8, #0x8e8] ; selector: span:log:file:func:line:module:msg:
102813704: b4000a16    	cbz	x22, 0x102813844 <___cxa_throw+0x42e514>
102813708: d00178c8    	adrp	x8, 0x10572d000 <dyld_stub_binder+0x10572d000>
10281370c: 91326108    	add	x8, x8, #0xc98 ; SecurityGuardOpenMiddleTierGeneric generate 'x-sign': %@
102813710: a9006fe8    	stp	x8, x27, [sp]
102813714: 90011844    	adrp	x4, 0x104b1b000 <dyld_stub_binder+0x104b1b000>
102813718: 91083484    	add	x4, x4, #0x20d ; MtopSDK/TBSDKSecurity.m
10281371c: 90011845    	adrp	x5, 0x104b1b000 <dyld_stub_binder+0x104b1b000>
102813720: 9111e8a5    	add	x5, x5, #0x47a ; -[TBSDKSecurity sign:input:]
102813724: b00178c7    	adrp	x7, 0x10572c000 <dyld_stub_binder+0x10572c000>
102813728: 910de0e7    	add	x7, x7, #0x378 ; MtopSDK
10281372c: aa1303e0    	mov	x0, x19
102813730: aa1c03e2    	mov	x2, x28
102813734: 52800063    	mov	w3, #0x3                ; =3
102813738: 52801946    	mov	w6, #0xca               ; =202
10281373c: 94707842    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813740: aa1c03e0    	mov	x0, x28
102813744: 9470785b    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813748: aa1b03e0    	mov	x0, x27
10281374c: 9470785f    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102813750: aa0003fb    	mov	x27, x0
102813754: aa0003fc    	mov	x28, x0
102813758: 1400004c    	b	0x102813888 <___cxa_throw+0x42e558>
10281375c: 9001d568    	adrp	x8, 0x1062bf000 <dyld_stub_binder+0x1062bf000>
102813760: f9412513    	ldr	x19, [x8, #0x248]
102813764: d503201f    	nop
102813768: f9418d00    	ldr	x0, [x8, #0x318]
10281376c: 9001cf88    	adrp	x8, 0x106203000 <dyld_stub_binder+0x106203000>
102813770: f9472101    	ldr	x1, [x8, #0xe40] ; selector: activeSpan
102813774: 94707834    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813778: aa1d03fd    	mov	x29, x29
10281377c: 9470785c    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102813780: aa0003f6    	mov	x22, x0
102813784: d001d448    	adrp	x8, 0x10629d000 <dyld_stub_binder+0x10629d000>
102813788: f9447501    	ldr	x1, [x8, #0x8e8] ; selector: span:log:file:func:line:module:msg:
10281378c: d00178c8    	adrp	x8, 0x10572d000 <dyld_stub_binder+0x10572d000>
102813790: 9130e108    	add	x8, x8, #0xc38 ; SecurityGuardOpenMiddleTierGeneric is NULL, generate 'x-sign' failed!
102813794: f90003e8    	str	x8, [sp]
102813798: 90011844    	adrp	x4, 0x104b1b000 <dyld_stub_binder+0x104b1b000>
10281379c: 91083484    	add	x4, x4, #0x20d ; MtopSDK/TBSDKSecurity.m
1028137a0: 90011845    	adrp	x5, 0x104b1b000 <dyld_stub_binder+0x104b1b000>
1028137a4: 9111e8a5    	add	x5, x5, #0x47a ; -[TBSDKSecurity sign:input:]
1028137a8: b00178c7    	adrp	x7, 0x10572c000 <dyld_stub_binder+0x10572c000>
1028137ac: 910de0e7    	add	x7, x7, #0x378 ; MtopSDK
1028137b0: aa1303e0    	mov	x0, x19
1028137b4: aa1603e2    	mov	x2, x22
1028137b8: d2800003    	mov	x3, #0x0                ; =0
1028137bc: 52801686    	mov	w6, #0xb4               ; =180
1028137c0: 94707821    	bl	0x104431844 <dyld_stub_binder+0x104431844>
1028137c4: aa1603e0    	mov	x0, x22
1028137c8: 9470783a    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
1028137cc: d280001c    	mov	x28, #0x0               ; =0
1028137d0: 1400003c    	b	0x1028138c0 <___cxa_throw+0x42e590>
1028137d4: 9001d568    	adrp	x8, 0x1062bf000 <dyld_stub_binder+0x1062bf000>
1028137d8: f9412513    	ldr	x19, [x8, #0x248]
1028137dc: d503201f    	nop
1028137e0: f9418d00    	ldr	x0, [x8, #0x318]
1028137e4: 9001cf88    	adrp	x8, 0x106203000 <dyld_stub_binder+0x106203000>
1028137e8: f9472101    	ldr	x1, [x8, #0xe40] ; selector: activeSpan
1028137ec: 94707816    	bl	0x104431844 <dyld_stub_binder+0x104431844>
1028137f0: aa1d03fd    	mov	x29, x29
1028137f4: 9470783e    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
1028137f8: aa0003fb    	mov	x27, x0
1028137fc: d001d448    	adrp	x8, 0x10629d000 <dyld_stub_binder+0x10629d000>
102813800: f9447501    	ldr	x1, [x8, #0x8e8] ; selector: span:log:file:func:line:module:msg:
102813804: d00178c8    	adrp	x8, 0x10572d000 <dyld_stub_binder+0x10572d000>
102813808: 91316108    	add	x8, x8, #0xc58 ; SecurityGuardOpenMiddleTierGeneric generate 'x-sign' failed, error: %@
10281380c: a9006be8    	stp	x8, x26, [sp]
102813810: 90011844    	adrp	x4, 0x104b1b000 <dyld_stub_binder+0x104b1b000>
102813814: 91083484    	add	x4, x4, #0x20d ; MtopSDK/TBSDKSecurity.m
102813818: 90011845    	adrp	x5, 0x104b1b000 <dyld_stub_binder+0x104b1b000>
10281381c: 9111e8a5    	add	x5, x5, #0x47a ; -[TBSDKSecurity sign:input:]
102813820: b00178c7    	adrp	x7, 0x10572c000 <dyld_stub_binder+0x10572c000>
102813824: 910de0e7    	add	x7, x7, #0x378 ; MtopSDK
102813828: aa1303e0    	mov	x0, x19
10281382c: aa1b03e2    	mov	x2, x27
102813830: d2800003    	mov	x3, #0x0                ; =0
102813834: 52801806    	mov	w6, #0xc0               ; =192
102813838: 94707803    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281383c: d280001c    	mov	x28, #0x0               ; =0
102813840: 14000013    	b	0x10281388c <___cxa_throw+0x42e55c>
102813844: d00178c8    	adrp	x8, 0x10572d000 <dyld_stub_binder+0x10572d000>
102813848: 9131e108    	add	x8, x8, #0xc78 ; SecurityGuardOpenMiddleTierGeneric ouput get 'x-sign' failed!
10281384c: f90003e8    	str	x8, [sp]
102813850: 90011844    	adrp	x4, 0x104b1b000 <dyld_stub_binder+0x104b1b000>
102813854: 91083484    	add	x4, x4, #0x20d ; MtopSDK/TBSDKSecurity.m
102813858: 90011845    	adrp	x5, 0x104b1b000 <dyld_stub_binder+0x104b1b000>
10281385c: 9111e8a5    	add	x5, x5, #0x47a ; -[TBSDKSecurity sign:input:]
102813860: b00178c7    	adrp	x7, 0x10572c000 <dyld_stub_binder+0x10572c000>
102813864: 910de0e7    	add	x7, x7, #0x378 ; MtopSDK
102813868: aa1303e0    	mov	x0, x19
10281386c: aa1c03e2    	mov	x2, x28
102813870: d2800003    	mov	x3, #0x0                ; =0
102813874: 528018c6    	mov	w6, #0xc6               ; =198
102813878: 947077f3    	bl	0x104431844 <dyld_stub_binder+0x104431844>
10281387c: aa1c03e0    	mov	x0, x28
102813880: 9470780c    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813884: d280001c    	mov	x28, #0x0               ; =0
102813888: f9401ff6    	ldr	x22, [sp, #0x38]
10281388c: aa1b03e0    	mov	x0, x27
102813890: 94707808    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813894: aa1903e0    	mov	x0, x25
102813898: 94707806    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
10281389c: aa1a03e0    	mov	x0, x26
1028138a0: 94707804    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
1028138a4: aa1803e0    	mov	x0, x24
1028138a8: 94707802    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
1028138ac: aa1703e0    	mov	x0, x23
1028138b0: 94707800    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
1028138b4: aa1603e0    	mov	x0, x22
1028138b8: 947077fe    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
1028138bc: f94023fb    	ldr	x27, [sp, #0x40]
1028138c0: aa1503e0    	mov	x0, x21
1028138c4: 947077fb    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
1028138c8: aa1403e0    	mov	x0, x20
1028138cc: 947077f9    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
1028138d0: aa1b03e0    	mov	x0, x27
1028138d4: 947077f7    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
1028138d8: aa1c03e0    	mov	x0, x28
1028138dc: a94a7bfd    	ldp	x29, x30, [sp, #0xa0]
1028138e0: a9494ff4    	ldp	x20, x19, [sp, #0x90]
1028138e4: a94857f6    	ldp	x22, x21, [sp, #0x80]
1028138e8: a9475ff8    	ldp	x24, x23, [sp, #0x70]
1028138ec: a94667fa    	ldp	x26, x25, [sp, #0x60]
1028138f0: a9456ffc    	ldp	x28, x27, [sp, #0x50]
1028138f4: 9102c3ff    	add	sp, sp, #0xb0
1028138f8: 14707794    	b	0x104431748 <dyld_stub_binder+0x104431748>
; TBSDKSecurity factorSign:input:extendParas:isUseWua:api:
1028138fc: d10383ff    	sub	sp, sp, #0xe0
102813900: a9086ffc    	stp	x28, x27, [sp, #0x80]
102813904: a90967fa    	stp	x26, x25, [sp, #0x90]
102813908: a90a5ff8    	stp	x24, x23, [sp, #0xa0]
10281390c: a90b57f6    	stp	x22, x21, [sp, #0xb0]
102813910: a90c4ff4    	stp	x20, x19, [sp, #0xc0]
102813914: a90d7bfd    	stp	x29, x30, [sp, #0xd0]
102813918: 910343fd    	add	x29, sp, #0xd0
10281391c: aa0603f6    	mov	x22, x6
102813920: aa0503f9    	mov	x25, x5
102813924: aa0403f5    	mov	x21, x4
102813928: aa0303f4    	mov	x20, x3
10281392c: aa0003f8    	mov	x24, x0
102813930: aa0203e0    	mov	x0, x2
102813934: 947077e5    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102813938: aa0003fb    	mov	x27, x0
10281393c: aa1403e0    	mov	x0, x20
102813940: 947077e2    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102813944: aa0003f4    	mov	x20, x0
102813948: aa1503e0    	mov	x0, x21
10281394c: 947077df    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102813950: aa0003f5    	mov	x21, x0
102813954: aa1603e0    	mov	x0, x22
102813958: 947077dc    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
10281395c: aa0003f6    	mov	x22, x0
102813960: b001cf68    	adrp	x8, 0x106200000 <dyld_stub_binder+0x106200000>
102813964: f9456501    	ldr	x1, [x8, #0xac8] ; selector: UnifiedTier
102813968: aa1803e0    	mov	x0, x24
10281396c: 947077b6    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813970: aa1d03fd    	mov	x29, x29
102813974: 947077de    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102813978: aa0003f7    	mov	x23, x0
10281397c: b4000860    	cbz	x0, 0x102813a88 <___cxa_throw+0x42e758>
102813980: 9001d513    	adrp	x19, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102813984: f942a67a    	ldr	x26, [x19, #0x548]
102813988: d001d0a8    	adrp	x8, 0x106229000 <dyld_stub_binder+0x106229000>
10281398c: f9442501    	ldr	x1, [x8, #0x848] ; selector: envMapToSecurityGuardEnv
102813990: aa1803e0    	mov	x0, x24
102813994: 947077ac    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813998: 93407c02    	sxtw	x2, w0
10281399c: 9001d228    	adrp	x8, 0x106257000 <dyld_stub_binder+0x106257000>
1028139a0: f9402901    	ldr	x1, [x8, #0x50] ; selector: numberWithInteger:
1028139a4: aa1a03e0    	mov	x0, x26
1028139a8: 947077a7    	bl	0x104431844 <dyld_stub_binder+0x104431844>
1028139ac: aa1d03fd    	mov	x29, x29
1028139b0: 947077cf    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
1028139b4: aa0003f8    	mov	x24, x0
1028139b8: f942a660    	ldr	x0, [x19, #0x548]
1028139bc: 9001d228    	adrp	x8, 0x106257000 <dyld_stub_binder+0x106257000>
1028139c0: f9401501    	ldr	x1, [x8, #0x28] ; selector: numberWithBool:
1028139c4: aa1903e2    	mov	x2, x25
1028139c8: 9470779f    	bl	0x104431844 <dyld_stub_binder+0x104431844>
1028139cc: aa1d03fd    	mov	x29, x29
1028139d0: 947077c7    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
1028139d4: aa0003f9    	mov	x25, x0
1028139d8: 9001d508    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
1028139dc: f9429500    	ldr	x0, [x8, #0x528]
1028139e0: 94707745    	bl	0x1044316f4 <dyld_stub_binder+0x1044316f4>
1028139e4: b001d168    	adrp	x8, 0x106240000 <dyld_stub_binder+0x106240000>
1028139e8: f941a901    	ldr	x1, [x8, #0x350] ; selector: initWithObjectsAndKeys:
1028139ec: d00178c8    	adrp	x8, 0x10572d000 <dyld_stub_binder+0x10572d000>
1028139f0: 9133e108    	add	x8, x8, #0xcf8 ; useWua
1028139f4: a9057fe8    	stp	x8, xzr, [sp, #0x50]
1028139f8: d00178c8    	adrp	x8, 0x10572d000 <dyld_stub_binder+0x10572d000>
1028139fc: 91336108    	add	x8, x8, #0xcd8 ; extendParas
102813a00: d0016f29    	adrp	x9, 0x1055f9000 <dyld_stub_binder+0x1055f9000>
102813a04: 913a6129    	add	x9, x9, #0xe98 ; api
102813a08: a90467e8    	stp	x8, x25, [sp, #0x40]
102813a0c: a90357e9    	stp	x9, x21, [sp, #0x30]
102813a10: b00170e8    	adrp	x8, 0x105630000 <dyld_stub_binder+0x105630000>
102813a14: 91146108    	add	x8, x8, #0x518 ; env
102813a18: a9025be8    	stp	x8, x22, [sp, #0x20]
102813a1c: b0016e28    	adrp	x8, 0x1055d8000 <dyld_stub_binder+0x1055d8000>
102813a20: 912a6108    	add	x8, x8, #0xa98 ; data
102813a24: 90016ec9    	adrp	x9, 0x1055eb000 <dyld_stub_binder+0x1055eb000>
102813a28: 911f6129    	add	x9, x9, #0x7d8 ; appkey
102813a2c: a90163e8    	stp	x8, x24, [sp, #0x10]
102813a30: a90053e9    	stp	x9, x20, [sp]
102813a34: aa1b03f3    	mov	x19, x27
102813a38: aa1b03e2    	mov	x2, x27
102813a3c: 94707782    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813a40: aa0003fb    	mov	x27, x0
102813a44: f81a83bf    	stur	xzr, [x29, #-0x58]
102813a48: d001d108    	adrp	x8, 0x106235000 <dyld_stub_binder+0x106235000>
102813a4c: f9406101    	ldr	x1, [x8, #0xc0] ; selector: getSecurityFactors:error:
102813a50: d10163a3    	sub	x3, x29, #0x58
102813a54: aa1703e0    	mov	x0, x23
102813a58: aa1b03e2    	mov	x2, x27
102813a5c: 9470777a    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813a60: aa1d03fd    	mov	x29, x29
102813a64: 947077a2    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102813a68: aa0003fa    	mov	x26, x0
102813a6c: f85a83a0    	ldur	x0, [x29, #-0x58]
102813a70: 94707796    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102813a74: aa0003fc    	mov	x28, x0
102813a78: b400045a    	cbz	x26, 0x102813b00 <___cxa_throw+0x42e7d0>
102813a7c: aa1a03e0    	mov	x0, x26
102813a80: 94707792    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102813a84: 14000042    	b	0x102813b8c <___cxa_throw+0x42e85c>
102813a88: 9001d568    	adrp	x8, 0x1062bf000 <dyld_stub_binder+0x1062bf000>
102813a8c: f9412518    	ldr	x24, [x8, #0x248]
102813a90: d503201f    	nop
102813a94: f9418d00    	ldr	x0, [x8, #0x318]
102813a98: 9001cf88    	adrp	x8, 0x106203000 <dyld_stub_binder+0x106203000>
102813a9c: f9472101    	ldr	x1, [x8, #0xe40] ; selector: activeSpan
102813aa0: 94707769    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813aa4: aa1d03fd    	mov	x29, x29
102813aa8: 94707791    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102813aac: aa0003f9    	mov	x25, x0
102813ab0: d001d448    	adrp	x8, 0x10629d000 <dyld_stub_binder+0x10629d000>
102813ab4: f9447501    	ldr	x1, [x8, #0x8e8] ; selector: span:log:file:func:line:module:msg:
102813ab8: d00178c8    	adrp	x8, 0x10572d000 <dyld_stub_binder+0x10572d000>
102813abc: 9132e108    	add	x8, x8, #0xcb8 ; SecurityGuardUnifiedTierGeneric is NULL, generate 'x-sign' failed!
102813ac0: f90003e8    	str	x8, [sp]
102813ac4: 90011844    	adrp	x4, 0x104b1b000 <dyld_stub_binder+0x104b1b000>
102813ac8: 91083484    	add	x4, x4, #0x20d ; MtopSDK/TBSDKSecurity.m
102813acc: 90011845    	adrp	x5, 0x104b1b000 <dyld_stub_binder+0x104b1b000>
102813ad0: 91166ca5    	add	x5, x5, #0x59b ; -[TBSDKSecurity factorSign:input:extendParas:isUseWua:api:]
102813ad4: b00178c7    	adrp	x7, 0x10572c000 <dyld_stub_binder+0x10572c000>
102813ad8: 910de0e7    	add	x7, x7, #0x378 ; MtopSDK
102813adc: aa1803e0    	mov	x0, x24
102813ae0: aa1903e2    	mov	x2, x25
102813ae4: d2800003    	mov	x3, #0x0                ; =0
102813ae8: 52801b26    	mov	w6, #0xd9               ; =217
102813aec: 94707756    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813af0: aa1903e0    	mov	x0, x25
102813af4: 9470776f    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813af8: d280001a    	mov	x26, #0x0               ; =0
102813afc: 1400002f    	b	0x102813bb8 <___cxa_throw+0x42e888>
102813b00: 9001d568    	adrp	x8, 0x1062bf000 <dyld_stub_binder+0x1062bf000>
102813b04: f9412508    	ldr	x8, [x8, #0x248]
102813b08: f90037e8    	str	x8, [sp, #0x68]
102813b0c: 9001d568    	adrp	x8, 0x1062bf000 <dyld_stub_binder+0x1062bf000>
102813b10: f9418d00    	ldr	x0, [x8, #0x318]
102813b14: 9001cf88    	adrp	x8, 0x106203000 <dyld_stub_binder+0x106203000>
102813b18: f9472101    	ldr	x1, [x8, #0xe40] ; selector: activeSpan
102813b1c: 9470774a    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813b20: aa1d03fd    	mov	x29, x29
102813b24: 94707772    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102813b28: f81a03b6    	stur	x22, [x29, #-0x60]
102813b2c: aa1503f6    	mov	x22, x21
102813b30: aa1403f5    	mov	x21, x20
102813b34: aa0003f4    	mov	x20, x0
102813b38: d001d448    	adrp	x8, 0x10629d000 <dyld_stub_binder+0x10629d000>
102813b3c: f9447501    	ldr	x1, [x8, #0x8e8] ; selector: span:log:file:func:line:module:msg:
102813b40: d00178c8    	adrp	x8, 0x10572d000 <dyld_stub_binder+0x10572d000>
102813b44: 91346108    	add	x8, x8, #0xd18 ; SecurityGuardUnifiedTierGeneric generate 'x-sign' failed, error: %@
102813b48: a90073e8    	stp	x8, x28, [sp]
102813b4c: 90011844    	adrp	x4, 0x104b1b000 <dyld_stub_binder+0x104b1b000>
102813b50: 91083484    	add	x4, x4, #0x20d ; MtopSDK/TBSDKSecurity.m
102813b54: 90011845    	adrp	x5, 0x104b1b000 <dyld_stub_binder+0x104b1b000>
102813b58: 91166ca5    	add	x5, x5, #0x59b ; -[TBSDKSecurity factorSign:input:extendParas:isUseWua:api:]
102813b5c: b00178c7    	adrp	x7, 0x10572c000 <dyld_stub_binder+0x10572c000>
102813b60: 910de0e7    	add	x7, x7, #0x378 ; MtopSDK
102813b64: f94037e0    	ldr	x0, [sp, #0x68]
102813b68: aa1403e2    	mov	x2, x20
102813b6c: d2800003    	mov	x3, #0x0                ; =0
102813b70: 52801ce6    	mov	w6, #0xe7               ; =231
102813b74: 94707734    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813b78: aa1403e0    	mov	x0, x20
102813b7c: aa1503f4    	mov	x20, x21
102813b80: aa1603f5    	mov	x21, x22
102813b84: f85a03b6    	ldur	x22, [x29, #-0x60]
102813b88: 9470774a    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813b8c: aa1a03e0    	mov	x0, x26
102813b90: 94707748    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813b94: aa1c03e0    	mov	x0, x28
102813b98: 94707746    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813b9c: aa1b03e0    	mov	x0, x27
102813ba0: 94707744    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813ba4: aa1903e0    	mov	x0, x25
102813ba8: 94707742    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813bac: aa1803e0    	mov	x0, x24
102813bb0: 94707740    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813bb4: aa1303fb    	mov	x27, x19
102813bb8: aa1703e0    	mov	x0, x23
102813bbc: 9470773d    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813bc0: aa1603e0    	mov	x0, x22
102813bc4: 9470773b    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813bc8: aa1503e0    	mov	x0, x21
102813bcc: 94707739    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813bd0: aa1403e0    	mov	x0, x20
102813bd4: 94707737    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813bd8: aa1b03e0    	mov	x0, x27
102813bdc: 94707735    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813be0: aa1a03e0    	mov	x0, x26
102813be4: a94d7bfd    	ldp	x29, x30, [sp, #0xd0]
102813be8: a94c4ff4    	ldp	x20, x19, [sp, #0xc0]
102813bec: a94b57f6    	ldp	x22, x21, [sp, #0xb0]
102813bf0: a94a5ff8    	ldp	x24, x23, [sp, #0xa0]
102813bf4: a94967fa    	ldp	x26, x25, [sp, #0x90]
102813bf8: a9486ffc    	ldp	x28, x27, [sp, #0x80]
102813bfc: 910383ff    	add	sp, sp, #0xe0
102813c00: 147076d2    	b	0x104431748 <dyld_stub_binder+0x104431748>
; TBSDKSecurity hmacsha1:key:
102813c04: d10203ff    	sub	sp, sp, #0x80
102813c08: a90367fa    	stp	x26, x25, [sp, #0x30]
102813c0c: a9045ff8    	stp	x24, x23, [sp, #0x40]
102813c10: a90557f6    	stp	x22, x21, [sp, #0x50]
102813c14: a9064ff4    	stp	x20, x19, [sp, #0x60]
102813c18: a9077bfd    	stp	x29, x30, [sp, #0x70]
102813c1c: 9101c3fd    	add	x29, sp, #0x70
102813c20: aa0303f3    	mov	x19, x3
102813c24: aa0203e0    	mov	x0, x2
102813c28: 90015d48    	adrp	x8, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102813c2c: f9438d08    	ldr	x8, [x8, #0x718]
102813c30: f9400108    	ldr	x8, [x8]
102813c34: f90017e8    	str	x8, [sp, #0x28]
102813c38: 94707724    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102813c3c: aa0003f4    	mov	x20, x0
102813c40: aa1303e0    	mov	x0, x19
102813c44: 94707721    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102813c48: 94707723    	bl	0x1044318d4 <dyld_stub_binder+0x1044318d4>
102813c4c: aa0003f3    	mov	x19, x0
102813c50: b001cfe8    	adrp	x8, 0x106210000 <dyld_stub_binder+0x106210000>
102813c54: f9421115    	ldr	x21, [x8, #0x420] ; selector: cStringUsingEncoding:
102813c58: aa1503e1    	mov	x1, x21
102813c5c: 52800082    	mov	w2, #0x4                ; =4
102813c60: 947076f9    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813c64: aa0003f6    	mov	x22, x0
102813c68: aa1403e0    	mov	x0, x20
102813c6c: 9470771a    	bl	0x1044318d4 <dyld_stub_binder+0x1044318d4>
102813c70: aa0003f4    	mov	x20, x0
102813c74: aa1503e1    	mov	x1, x21
102813c78: 52800082    	mov	w2, #0x4                ; =4
102813c7c: 947076f2    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813c80: aa0003f5    	mov	x21, x0
102813c84: aa1603e0    	mov	x0, x22
102813c88: 94707941    	bl	0x10443218c <dyld_stub_binder+0x10443218c>
102813c8c: aa0003f7    	mov	x23, x0
102813c90: aa1503e0    	mov	x0, x21
102813c94: 9470793e    	bl	0x10443218c <dyld_stub_binder+0x10443218c>
102813c98: aa0003e4    	mov	x4, x0
102813c9c: 910053f8    	add	x24, sp, #0x14
102813ca0: 910053e5    	add	x5, sp, #0x14
102813ca4: 52800000    	mov	w0, #0x0                ; =0
102813ca8: aa1603e1    	mov	x1, x22
102813cac: aa1703e2    	mov	x2, x23
102813cb0: aa1503e3    	mov	x3, x21
102813cb4: 94706346    	bl	0x10442c9cc <dyld_stub_binder+0x10442c9cc>
102813cb8: 9001d508    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102813cbc: f9459500    	ldr	x0, [x8, #0xb28]
102813cc0: b001d468    	adrp	x8, 0x1062a0000 <dyld_stub_binder+0x1062a0000>
102813cc4: f9464d01    	ldr	x1, [x8, #0xc98] ; selector: stringWithCapacity:
102813cc8: 52800502    	mov	w2, #0x28               ; =40
102813ccc: 947076de    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813cd0: aa1d03fd    	mov	x29, x29
102813cd4: 94707706    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102813cd8: aa0003f5    	mov	x21, x0
102813cdc: d2800019    	mov	x25, #0x0               ; =0
102813ce0: d001cfa8    	adrp	x8, 0x106209000 <dyld_stub_binder+0x106209000>
102813ce4: f943b516    	ldr	x22, [x8, #0x768] ; selector: appendFormat:
102813ce8: d0016e57    	adrp	x23, 0x1055dd000 <dyld_stub_binder+0x1055dd000>
102813cec: 913062f7    	add	x23, x23, #0xc18 ; %02x
102813cf0: 38796b08    	ldrb	w8, [x24, x25]
102813cf4: f90003e8    	str	x8, [sp]
102813cf8: aa1503e0    	mov	x0, x21
102813cfc: aa1603e1    	mov	x1, x22
102813d00: aa1703e2    	mov	x2, x23
102813d04: 947076d0    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813d08: 91000739    	add	x25, x25, #0x1
102813d0c: f100533f    	cmp	x25, #0x14
102813d10: 54ffff01    	b.ne	0x102813cf0 <___cxa_throw+0x42e9c0>
102813d14: aa1303e0    	mov	x0, x19
102813d18: 947076e6    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813d1c: aa1403e0    	mov	x0, x20
102813d20: 947076e4    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813d24: f94017e8    	ldr	x8, [sp, #0x28]
102813d28: 90015d49    	adrp	x9, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102813d2c: f9438d29    	ldr	x9, [x9, #0x718]
102813d30: f9400129    	ldr	x9, [x9]
102813d34: eb08013f    	cmp	x9, x8
102813d38: 54000121    	b.ne	0x102813d5c <___cxa_throw+0x42ea2c>
102813d3c: aa1503e0    	mov	x0, x21
102813d40: a9477bfd    	ldp	x29, x30, [sp, #0x70]
102813d44: a9464ff4    	ldp	x20, x19, [sp, #0x60]
102813d48: a94557f6    	ldp	x22, x21, [sp, #0x50]
102813d4c: a9445ff8    	ldp	x24, x23, [sp, #0x40]
102813d50: a94367fa    	ldp	x26, x25, [sp, #0x30]
102813d54: 910203ff    	add	sp, sp, #0x80
102813d58: 1470767c    	b	0x104431748 <dyld_stub_binder+0x104431748>
102813d5c: 97c6c8af    	bl	0x1019c6018 <__ZN5hmdBU10async_safe11linked_listI22hmdBU_async_dict_entryE4nextEPNS3_4nodeE+0x5168>
102813d60: a9bd57f6    	stp	x22, x21, [sp, #-0x30]!
102813d64: a9014ff4    	stp	x20, x19, [sp, #0x10]
102813d68: a9027bfd    	stp	x29, x30, [sp, #0x20]
102813d6c: 910083fd    	add	x29, sp, #0x20
102813d70: aa0003f4    	mov	x20, x0
102813d74: aa0203e0    	mov	x0, x2
102813d78: 947076d4    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102813d7c: aa0003f3    	mov	x19, x0
102813d80: b001d448    	adrp	x8, 0x10629c000 <dyld_stub_binder+0x10629c000>
102813d84: f9436101    	ldr	x1, [x8, #0x6c0] ; selector: signatureVersion
102813d88: aa1403e0    	mov	x0, x20
102813d8c: 947076ae    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813d90: aa1d03fd    	mov	x29, x29
102813d94: 947076d6    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102813d98: aa0003f5    	mov	x21, x0
102813d9c: f001d188    	adrp	x8, 0x106246000 <dyld_stub_binder+0x106246000>
102813da0: f944a901    	ldr	x1, [x8, #0x950] ; selector: isNewVersionEnabled
102813da4: 947076a8    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813da8: aa0003f6    	mov	x22, x0
102813dac: aa1503e0    	mov	x0, x21
102813db0: 947076c0    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813db4: 34000336    	cbz	w22, 0x102813e18 <___cxa_throw+0x42eae8>
102813db8: 9001d108    	adrp	x8, 0x106233000 <dyld_stub_binder+0x106233000>
102813dbc: f9449101    	ldr	x1, [x8, #0x920] ; selector: getMiddleTierWua:
102813dc0: aa1403e0    	mov	x0, x20
102813dc4: aa1303e2    	mov	x2, x19
102813dc8: 9470769f    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813dcc: aa1d03fd    	mov	x29, x29
102813dd0: 947076c7    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102813dd4: aa0003f5    	mov	x21, x0
102813dd8: 9001d1c8    	adrp	x8, 0x10624b000 <dyld_stub_binder+0x10624b000>
102813ddc: f944e901    	ldr	x1, [x8, #0x9d0] ; selector: length
102813de0: 94707699    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813de4: b50002a0    	cbnz	x0, 0x102813e38 <___cxa_throw+0x42eb08>
102813de8: b001d0e8    	adrp	x8, 0x106230000 <dyld_stub_binder+0x106230000>
102813dec: f943f901    	ldr	x1, [x8, #0x7f0] ; selector: getAvmpWua:
102813df0: aa1403e0    	mov	x0, x20
102813df4: aa1303e2    	mov	x2, x19
102813df8: 94707693    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813dfc: aa1d03fd    	mov	x29, x29
102813e00: 947076bb    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102813e04: aa0003f4    	mov	x20, x0
102813e08: aa1503e0    	mov	x0, x21
102813e0c: 947076a9    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813e10: aa1403f5    	mov	x21, x20
102813e14: 14000009    	b	0x102813e38 <___cxa_throw+0x42eb08>
102813e18: b001d0e8    	adrp	x8, 0x106230000 <dyld_stub_binder+0x106230000>
102813e1c: f943f901    	ldr	x1, [x8, #0x7f0] ; selector: getAvmpWua:
102813e20: aa1403e0    	mov	x0, x20
102813e24: aa1303e2    	mov	x2, x19
102813e28: 94707687    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102813e2c: aa1d03fd    	mov	x29, x29
102813e30: 947076af    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102813e34: aa0003f5    	mov	x21, x0
102813e38: aa1303e0    	mov	x0, x19
102813e3c: 9470769d    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102813e40: aa1503e0    	mov	x0, x21
102813e44: 94707638    	bl	0x104431724 <dyld_stub_binder+0x104431724>
102813e48: a9427bfd    	ldp	x29, x30, [sp, #0x20]
102813e4c: a9414ff4    	ldp	x20, x19, [sp, #0x10]
102813e50: a8c357f6    	ldp	x22, x21, [sp], #0x30
102813e54: d65f03c0    	ret
102813e58: d10303ff    	sub	sp, sp, #0xc0
102813e5c: a9066ffc    	stp	x28, x27, [sp, #0x60]
102813e60: a90767fa    	stp	x26, x25, [sp, #0x70]
102813e64: a9085ff8    	stp	x24, x23, [sp, #0x80]
102813e68: a90957f6    	stp	x22, x21, [sp, #0x90]
102813e6c: a90a4ff4    	stp	x20, x19, [sp, #0xa0]
102813e70: a90b7bfd    	stp	x29, x30, [sp, #0xb0]
102813e74: 9102c3fd    	add	x29, sp, #0xb0
102813e78: aa0003f3    	mov	x19, x0
102813e7c: aa0203e0    	mov	x0, x2
