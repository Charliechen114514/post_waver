---
title: "How My Arch Linux StartUp"
date: 2024-05-05
---

# How Linux Works I - How Linux Start Up

> 写在前面：上一个专栏中我写完了内核源码层面看Linux，我们把抽象层拉高一点，看看Linux是如何工作的！

## Linux如何启动？

> 1.  BIOS（Basic Input Output System）或者启动固件加载并运行引导装载程序（告知OS在哪里）
> 2.  引导装载程序在磁盘上找到内核的位置，载入RAM中启动
> 3.  初始化设备与驱动程序
> 4.  挂载root文件系统
> 5.  内核使用swapper进程（0号进程，PID = 1）来允许一个init进程，从这里开始，我们的程序将会被下放到用户态
> 6.  init继续启动其他进程
> 7.  最后的尾声就是启动一个登陆进程！是的，就是那个让你输入用户密码的那个界面就是登录进程完成的

![image-20240505183113071](.\\image-20240505183113071.png)

## 启动信息

​Linux内核启动信息去这里看：

```bash
sudo dmesg > demo.txt
```

​这条指令可以将输出的信息发送到demo.txt文件当中，或者你想要在控制台上看

```bash
sudo dmesg | less
```

​将会调度less程序使得日志分页。一些启动日志将会保存在`/var/log/`下面，不同的发行版会有不同的调整，比如说我这里就没有什么一下就可以找到的开机日志文件（`Arch Linux`）

```text
[    0.000000] Linux version 6.8.8-arch1-1 (linux@archlinux) (gcc (GCC) 13.2.1 20240417, GNU ld (GNU Binutils) 2.42.0) #1 SMP PREEMPT_DYNAMIC Sun, 28 Apr 2024 15:59:47 +0000
[    0.000000] Command line: BOOT_IMAGE=/@/boot/vmlinuz-linux root=UUID=c6ae9e8b-6dd3-4a7b-99bf-fcedbd6ab74c rw rootflags=subvol=@ loglevel=3 quiet
[    0.000000] [Firmware Bug]: TSC doesn't count with P0 frequency!
[    0.000000] BIOS-provided physical RAM map:
[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x0000000000000fff] ACPI NVS
[    0.000000] BIOS-e820: [mem 0x0000000000001000-0x000000000009ffff] usable
...
[   74.611975] systemd-journald[246]: /var/log/journal/deaaebab639c462183f85623319ae5fc/user-1000.journal: Journal file uses a different sequence number ID, rotating.
[  273.008400] systemd[1]: systemd 255.5-4-arch running in system mode (+PAM +AUDIT -SELINUX -APPARMOR -IMA +SMACK +SECCOMP +GCRYPT +GNUTLS +OPENSSL +ACL +BLKID +CURL +ELFUTILS +FIDO2 +IDN2 -IDN +IPTC +KMOD +LIBCRYPTSETUP +LIBFDISK +PCRE2 +PWQUALITY +P11KIT +QRENCODE +TPM2 +BZIP2 +LZ4 +XZ +ZLIB +ZSTD +BPF_FRAMEWORK +XKBCOMMON +UTMP -SYSVINIT default-hierarchy=unified)
[  273.008505] systemd[1]: Detected virtualization vmware.
[  273.008596] systemd[1]: Detected architecture x86-64.
[  273.424093] systemd[1]: bpf-lsm: LSM BPF program attached
[  352.419139] perf: interrupt took too long (2590 > 2500), lowering kernel.perf_event_max_sample_rate to 77100
[  390.817032] perf: interrupt took too long (3500 > 3237), lowering kernel.perf_event_max_sample_rate to 57000
[  527.871009] perf: interrupt took too long (4415 > 4375), lowering kernel.perf_event_max_sample_rate to 45300
```

## 分析dmesg启动文件

我们先简单看看基本的流程：

1.  检查CPU
2.  检查内存
3.  检查设备总线
4.  检测设备
5.  设置附加内核子系统
6.  挂载 root 目录
7.  启动用户空间

​这是我学习的这本书告知我的流程，我还是觉得没什么味道，这里写一个更加详细的，依照系统日志版本的

1.  第一步，查看Linux内核版本，确定内核的一些设置参数（这里你可以看到我的系统是使用了支持SMP多核架构编译选项了的内核 + 支持动态抢占（这点是自从2.6开始就有了的CFS调度的特性）选项编译的内核）

```text
[    0.000000] Linux version 6.8.8-arch1-1 (linux@archlinux) (gcc (GCC) 13.2.1 20240417, GNU ld (GNU Binutils) 2.42.0) #1 SMP PREEMPT_DYNAMIC Sun, 28 Apr 2024 15:59:47 +0000
```

1.  第二步：找到内核位置

```text
Command line: BOOT_IMAGE=/@/boot/vmlinuz-linux root=UUID=c6ae9e8b-6dd3-4a7b-99bf-fcedbd6ab74c rw rootflags=subvol=@ loglevel=3 quiet
```

> **vmlinuz是可引导的、压缩的内核**。"vm"代表"Virtual Memory"。Linux 支持虚拟内存，不像老的操作系统比如DOS有640KB内存的限制。Linux能够使用硬盘空间作为虚拟内存，因此得名"vm"。vmlinuz是可执行的Linux内核，它位于/boot/vmlinuz，它一般是一个软链接。

1.  第三步：开始使用BIOS自举检查的信息：比如说，我们上面提到的------检查内存：

```text
[    0.000000] BIOS-provided physical RAM map:  # 是的，BIOS提供的物理RAM内存视图
[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x0000000000000fff] ACPI NVS
[    0.000000] BIOS-e820: [mem 0x0000000000001000-0x000000000009ffff] usable
[    0.000000] BIOS-e820: [mem 0x00000000000c0000-0x00000000000fffff] reserved
[    0.000000] BIOS-e820: [mem 0x0000000000100000-0x000000000e655fff] usable
[    0.000000] BIOS-e820: [mem 0x000000000e656000-0x000000000e672fff] ACPI data
[    0.000000] BIOS-e820: [mem 0x000000000e673000-0x000000000efaafff] usable
[    0.000000] BIOS-e820: [mem 0x000000000efab000-0x000000000efaefff] reserved
[    0.000000] BIOS-e820: [mem 0x000000000efaf000-0x000000000efbcfff] usable
[    0.000000] BIOS-e820: [mem 0x000000000efbd000-0x000000000efc1fff] reserved
[    0.000000] BIOS-e820: [mem 0x000000000efc2000-0x000000000efc6fff] ACPI NVS
[    0.000000] BIOS-e820: [mem 0x000000000efc7000-0x000000000fee5fff] usable
[    0.000000] BIOS-e820: [mem 0x000000000fee6000-0x000000000ff55fff] reserved
[    0.000000] BIOS-e820: [mem 0x000000000ff56000-0x000000000ff71fff] ACPI data
[    0.000000] BIOS-e820: [mem 0x000000000ff72000-0x000000000ff75fff] ACPI NVS
[    0.000000] BIOS-e820: [mem 0x000000000ff76000-0x00000000bfffffff] usable
[    0.000000] BIOS-e820: [mem 0x00000000ffc00000-0x00000000ffc29fff] reserved
[    0.000000] BIOS-e820: [mem 0x0000000100000000-0x000000023fffffff] usable #  4G起始空间 - 8G
```

> S在操作系统开始管理内存之前，首先要获取物理内存的信息，比如一共有多少物理地址是可用的，有哪些物理地址是被ACPI数据使用（关于PCI，ACPI我下面会简单的介绍，先不着急）

可以查询到的一些字段说明：

-   Usable：已经被映射到物理内存的物理地址。（也就是可用的）
-   Reserved：这些区间是没有被映射到任何地方，不能当作RAM来使用，但是kernel可以决定将这些区间映射到其他地方，**比如PCI设备。通过检查/proc/iomem这个虚拟文件，就可以知道这些reserved的空间**，是如何进一步分配给不同的设备来使用了。
-   ACPI data：映射到用来存放ACPI数据的RAM空间，操作系统应该将ACPI Table读入到这个区间内。
-   ACPI NVS：映射到用来存放ACPI数据的非易失性存储空间，操作系统不能使用。
-   Unusable：表示检测到发生错误的物理内存。这个在上面例子里没有，因为比较少见。

我们的物理地址检查到了8G的大小，符合我们的设置吗？符合！说明BIOS探测没有问题，且所有的物理内存都可用（至少没有Unusable）

![image-20240505191234413](.\\image-20240505191234413.png)

确认开启NX保护机制，也就是说我们的内存页不可执行（CPU并不知道我们的来的流是数据是数据还是指令，把数据段当成指令段。。。嗯，你懂的）

> NX即No-eXecute（不可执行）的意思，NX（DEP）的基本原理是将数据所在内存页标识为不可执行，当程序溢出成功转入shellcode时，程序会尝试在数据页面上执行指令，此时CPU就会抛出异常，而不是去执行恶意指令。

1.  第四步：静态初始化高级可编程中断控制器，也就是我们的APIC，管中断的！这里开始，定时器等跟中断相关的设备开始初始化

```yaml
APIC: Static calls initialized
```

下面的e820是啥？嘿嘿，你知道的，任何一个手搓过Operating System的人都直到我们OS启动之后，还得进一步探测内存，方法？很简单，x86架构有一个简单的方式告知整个架构系统自己开始查RAM内存：也就是往RAX寄存器（如果是32位那就是往EAX，16位老古董？AX！）塞值：E820H，然后在我们向已经局部初始化的APIC发起一个中断：BIOS中断号15H

```text
mov eax, $e820H
int 15h ; 15号中断
```

​查得很快，我们的RAM局部图现在就会被排布成这样。

```text
 0.000000] e820: update [mem 0x0c2c6018-0x0c2ce057] usable ==> usable
[    0.000000] e820: update [mem 0x0e60b018-0x0e60d057] usable ==> usable
[    0.000000] e820: update [mem 0x0e60b018-0x0e60d057] usable ==> usable
[    0.000000] e820: update [mem 0x0e609018-0x0e60a857] usable ==> usable
[    0.000000] e820: update [mem 0x0e609018-0x0e60a857] usable ==> usable
[    0.000000] extended physical RAM map:
[    0.000000] reserve setup_data: [mem 0x0000000000000000-0x0000000000000fff] ACPI NVS
[    0.000000] reserve setup_data: [mem 0x0000000000001000-0x000000000009ffff] usable
[    0.000000] reserve setup_data: [mem 0x00000000000c0000-0x00000000000fffff] reserved
[    0.000000] reserve setup_data: [mem 0x0000000000100000-0x000000000c2c6017] usable
[    0.000000] reserve setup_data: [mem 0x000000000c2c6018-0x000000000c2ce057] usable
[    0.000000] reserve setup_data: [mem 0x000000000c2ce058-0x000000000e609017] usable
[    0.000000] reserve setup_data: [mem 0x000000000e609018-0x000000000e60a857] usable
[    0.000000] reserve setup_data: [mem 0x000000000e60a858-0x000000000e60b017] usable
[    0.000000] reserve setup_data: [mem 0x000000000e60b018-0x000000000e60d057] usable
[    0.000000] reserve setup_data: [mem 0x000000000e60d058-0x000000000e655fff] usable
[    0.000000] reserve setup_data: [mem 0x000000000e656000-0x000000000e672fff] ACPI data
[    0.000000] reserve setup_data: [mem 0x000000000e673000-0x000000000efaafff] usable
[    0.000000] reserve setup_data: [mem 0x000000000efab000-0x000000000efaefff] reserved
[    0.000000] reserve setup_data: [mem 0x000000000efaf000-0x000000000efbcfff] usable
[    0.000000] reserve setup_data: [mem 0x000000000efbd000-0x000000000efc1fff] reserved
[    0.000000] reserve setup_data: [mem 0x000000000efc2000-0x000000000efc6fff] ACPI NVS
[    0.000000] reserve setup_data: [mem 0x000000000efc7000-0x000000000fee5fff] usable
[    0.000000] reserve setup_data: [mem 0x000000000fee6000-0x000000000ff55fff] reserved
[    0.000000] reserve setup_data: [mem 0x000000000ff56000-0x000000000ff71fff] ACPI data
[    0.000000] reserve setup_data: [mem 0x000000000ff72000-0x000000000ff75fff] ACPI NVS
[    0.000000] reserve setup_data: [mem 0x000000000ff76000-0x00000000bfffffff] usable
[    0.000000] reserve setup_data: [mem 0x00000000ffc00000-0x00000000ffc29fff] reserved
[    0.000000] reserve setup_data: [mem 0x0000000100000000-0x000000023fffffff] usable
```

1.  下面就是EFI接手进一步启动工作EFI，是Extensible Firmware Interface的词头缩写，直译过来就是可扩展固件接口，它是用模块化、高级语言（主要是C语言）构建的一个小型化系统，它和BIOS一样，主要在启动过程中完成硬件初始化，但它是直接利用加载EFI驱动的方式，识别系统硬件并完成硬件初始化，彻底摒弃读各种中断执行。

2.  不过这里，会确定下来我们的系统允许的平台和信息，使用的是SMBIOS（*System Management BIOS*），从而确认我们的主板信息等

```yaml
efi: 
SMBIOS=0xefc2000 # ACPI数据的非易失性存储空间，操作系统不能使用，这里就是给SMBIOS用了
ACPI 2.0=0xe656000 # 看到上面的RAM配置图了吗，果然ACPI被安排到这里了
MEMATTR=0xfcc3798 # 这里存放着内存的属性表，是后续工作用来确定这块内存干啥的
# 对这部分源码有兴趣：/efi/memattr.c看看
INITRD=0xe608e98 # boot loader iniTIalized RAM disk，就是由 boot loader 初始化的内存盘,这是为了给初始化真正的文件系统之前，系统使用的文件系统，这里排布了他的位置！
```

查出来我的主板信息了：哈哈，是虚拟机！

```yaml
DMI: VMware, Inc. VMware7,1/440BX Desktop Reference Platform, BIOS VMW71.00V.18452719.B64.2108091906 08/09/2021
```

​所以，他会初始化虚拟机作用下的系统调用转发等工作（你知道的，虚拟机本身就是寄宿在客机上的，中间的一些步骤没啥好看的）

```text
[    0.000000] vmware: hypercall mode: 0x01
[    0.000000] Hypervisor detected: VMware
[    0.000000] vmware: TSC freq read from hypervisor : 3193.892 MHz
[    0.000000] vmware: Host bus clock speed read from hypervisor : 66000000 Hz
[    0.000000] vmware: using clock offset of 4464998876 ns # 没啥好看的，查出来是vmware，，做一些工作
```

1.  下一步，确定主板架构之后，读取CPU相关的信息，更新我们的RAM mapping：

```text
[    0.000013] tsc: Detected 3193.892 MHz processor # 时间戳计数器（TSC，Time Stamp Counter）
[    0.320730] e820: update [mem 0x00000000-0x00000fff] usable ==> reserved
[    0.320737] e820: remove [mem 0x000a0000-0x000fffff] usable
```

​TSC可以到我讲定时测量的部分看看，与之相关的还有HPET！

1.  准备为查好的内存建立页表，划分空间的3GB-4GB部分为内核使用！

```text
[    0.320879] x86/PAT: Configuration [0-7]: WB  WC  UC- UC  WB  WP  UC- WT  
# 令人激动的一步！再这里开始，我们的后3GB - 4GB内存划分给了内核
[    0.320935] e820: update [mem 0xc0000000-0xffffffff] usable ==> reserved
[    0.320938] last_pfn = 0xc0000 max_arch_pfn = 0x400000000
[    0.323887] Using GB pages for direct mapping
[    0.324326] Secure boot disabled
```

说一下：

-   Strong Uncacheable （UC）:这种cache类型的memory，任何读写操作都不经过cache。一般是memory-map的IO地址可以使用这种类型。一般的ram强烈推荐不使用这种cache，否则效率会非常低。
-   Write Back！（WB）最常见的 cacheable write
-   Uncacheable （UC-）:特性与UC(Strong uncacheable)相同，唯一不同的是，这种类型的memory，可以通过修改MTRR来把它改变成WC
-   Write Combining （WC）:这种类型的cache，特性与UC相似，不同的地方是它可以被speculative read（预先随机读取，这个小机制我们在看文件系统的时候还会看到！）每次write都可能被delay，write的内容会buffer到一个叫"write combining buffer"的地方。可以通过 对MTRR编程来设置WC，也可以通过设置PAT来设置WC(pat是什么？)
-   Write -- through （WT）:这个很好理解，每次write，都要write到memory，同时write到对应的cache（if write hits）。WT方式保证了cache与memory是一致的。这种类型的memory，read和write，都跟一般的cache一样。只是write的时候，当写到了cache中，不会立即write到memory里（这个就跟WT不一样了）。CPU会等到适当的时候再write到memory里---比如当cache满了。 这种类型是效率最高的类型，
-   Write-protected （WP）:Read跟wb一样，但每次write，都会引起cache invalidate

​同时，针对AMD（这里透过虚拟机查到了我的电脑是AMD64，可以支持AMD的大TLB缓存）（Using GB pages for direct mapping）

​下面初始化就是存放APIC中的一些数据结构的一些结构说明

-   FADT (Fixed ACPI Description Table) ，主要放了一些硬件信息和DSDT的地址。
-   MADT(Multiple APIC Description Table )，描述了中断硬件相关的信息。
-   PPTT(Processor Properties Topology Table), 描述了CPU相关的信息。
-   MCFG(PCI Express memory mapped configuration space base address Description Table) PCIE内存空间先关的地址。
-   GTDT(Generic Timer Description Table), 描述了timer相关的信息。
-   SPCR(Serial Port Console Redirection Table), 描述了串口相关的信息。
-   DBG2(Debug Port Table)， 描述了Debug口相关信息。
-   IORT(I/O Remapping Table), 描述了IO Remap相关信息。

看完了：

```text
[    0.324369] ACPI: Reserving SRAT table memory at [mem 0xe6560c0-0xe65698f]
[    0.324370] ACPI: Reserving FACP table memory at [mem 0xe671bf8-0xe671ceb]
[    0.324370] ACPI: Reserving DSDT table memory at [mem 0xe656990-0xe671bf7]
[    0.324371] ACPI: Reserving FACS table memory at [mem 0xff75000-0xff7503f]
[    0.324371] ACPI: Reserving FACS table memory at [mem 0xff75000-0xff7503f]
[    0.324372] ACPI: Reserving APIC table memory at [mem 0xe672000-0xe672741]
[    0.324372] ACPI: Reserving MCFG table memory at [mem 0xe672742-0xe67277d]
[    0.324373] ACPI: Reserving HPET table memory at [mem 0xe67277e-0xe6727b5]
[    0.324373] ACPI: Reserving WAET table memory at [mem 0xe6727b6-0xe6727dd]
[    0.324374] ACPI: Reserving WSMT table memory at [mem 0xe6727de-0xe672805]
[    0.324410] system APIC only can use physical flat
[    0.324415] APIC: Switched APIC routing to: physical flat # 物理平坦模型！
```

在下面就是初始化各个表，这里不再枚举！

```text
[    0.324445] SRAT: PXM 0 -> APIC 0x00 -> Node 0
[    0.324447] SRAT: PXM 0 -> APIC 0x01 -> Node 0
[    0.324447] SRAT: PXM 0 -> APIC 0x02 -> Node 0
[    0.324447] SRAT: PXM 0 -> APIC 0x03 -> Node 0
...
```

1.  开始初始化一些子系统：比如说

```yaml
PM: hibernation: Registered nosave memory: [mem 0x00000000-0x00000fff]
[    0.543907] PM: hibernation: Registered nosave memory: [mem 0x000a0000-0x000bffff]
[    0.543907] PM: hibernation: Registered nosave memory: [mem 0x000c0000-0x000fffff]
[    0.543908] PM: hibernation: Registered nosave memory: [mem 0x0c2c6000-0x0c2c6fff]
[    0.543909] PM: hibernation: Registered nosave memory: [mem 0x0c2ce000-0x0c2cefff]
[    0.543910] PM: hibernation: Registered nosave memory: [mem 0x0e609000-0x0e609fff]
[    0.543910] PM: hibernation: Registered nosave memory: [mem 0x0e60a000-0x0e60afff]
[    0.543910] PM: hibernation: Registered nosave memory: [mem 0x0e60b000-0x0e60bfff]
[    0.543911] PM: hibernation: Registered nosave memory: [mem 0x0e60d000-0x0e60dfff]
[    0.543912] PM: hibernation: Registered nosave memory: [mem 0x0e656000-0x0e672fff]
[    0.543912] PM: hibernation: Registered nosave memory: [mem 0x0efab000-0x0efaefff]
[    0.543913] PM: hibernation: Registered nosave memory: [mem 0x0efbd000-0x0efc1fff]
[    0.543914] PM: hibernation: Registered nosave memory: [mem 0x0efc2000-0x0efc6fff]
[    0.543914] PM: hibernation: Registered nosave memory: [mem 0x0fee6000-0x0ff55fff]
[    0.543915] PM: hibernation: Registered nosave memory: [mem 0x0ff56000-0x0ff71fff]
[    0.543915] PM: hibernation: Registered nosave memory: [mem 0x0ff72000-0x0ff75fff]
[    0.543916] PM: hibernation: Registered nosave memory: [mem 0xc0000000-0xffbfffff]
[    0.543916] PM: hibernation: Registered nosave memory: [mem 0xffc00000-0xffc29fff]
[    0.543917] PM: hibernation: Registered nosave memory: [mem 0xffc2a000-0xffffffff]
# 这里就是电源管理系统，他开始注册监察内存，信息是从先前的排查中获取的
```

​这里开始初始化我们内核要使用的per-cpu变量了，从这里开始我们慢慢熟悉起来了：

```text
[    0.602809] pcpu-alloc: s225280 r8192 d28672 u262144 alloc=1*2097152
[    0.602812] pcpu-alloc: [0] 000 001 002 003 004 005 006 007 
[    0.602815] pcpu-alloc: [0] 008 009 010 011 012 013 014 015 
[    0.602818] pcpu-alloc: [0] 016 017 018 019 020 021 022 023 
[    0.602820] pcpu-alloc: [0] 024 025 026 027 028 029 030 031 
[    0.602823] pcpu-alloc: [0] 032 033 034 035 036 037 038 039 
[    0.602825] pcpu-alloc: [0] 040 041 042 043 044 045 046 047 
[    0.602828] pcpu-alloc: [0] 048 049 050 051 052 053 054 055 
[    0.602830] pcpu-alloc: [0] 056 057 058 059 060 061 062 063 
[    0.602833] pcpu-alloc: [0] 064 065 066 067 068 069 070 071 
[    0.602835] pcpu-alloc: [0] 072 073 074 075 076 077 078 079 
[    0.602838] pcpu-alloc: [0] 080 081 082 083 084 085 086 087 
[    0.602840] pcpu-alloc: [0] 088 089 090 091 092 093 094 095 
[    0.602843] pcpu-alloc: [0] 096 097 098 099 100 101 102 103 
[    0.602845] pcpu-alloc: [0] 104 105 106 107 108 109 110 111 
[    0.602848] pcpu-alloc: [0] 112 113 114 115 116 117 118 119 
[    0.602850] pcpu-alloc: [0] 120 121 122 123 124 125 126 127 
```

​基础的中断硬件支持激活，内存排查，页表等建立已经结束，我们开始真正的引导内核进入，下面是它打印先前设备接管的信息：

```text
# 内核
[    0.602882] Kernel command line: BOOT_IMAGE=/@/boot/vmlinuz-linux root=UUID=c6ae9e8b-6dd3-4a7b-99bf-fcedbd6ab74c rw rootflags=subvol=@ loglevel=3 quiet
[    0.602926] Unknown kernel command line parameters "BOOT_IMAGE=/@/boot/vmlinuz-linux", will be passed to user space.
[    0.602947] random: crng init done
[    0.602948] printk: log_buf_len individual max cpu contribution: 4096 bytes
[    0.602948] printk: log_buf_len total cpu_extra contributions: 520192 bytes
[    0.602949] printk: log_buf_len min size: 131072 bytes
[    0.610763] printk: log_buf_len: 1048576 bytes
[    0.610765] printk: early log buf free: 103752(79%)
[    0.624062] Dentry cache hash table entries: 1048576 (order: 11, 8388608 bytes, linear)
[    0.630705] Inode-cache hash table entries: 524288 (order: 10, 4194304 bytes, linear)
[    0.633598] Fallback order for Node 0: 0 
[    0.633618] Built 1 zonelists, mobility grouping on.  Total pages: 2063943
[    0.633620] Policy zone: Normal
[    0.638437] mem auto-init: stack:all(zero), heap alloc:on, heap free:off
[    0.638444] software IO TLB: area num 128.
[    0.736554] Memory: 8058148K/8387472K available (16384K kernel code, 2121K rwdata, 12976K rodata, 3448K init, 3776K bss, 329064K reserved, 0K cma-reserved)
[    0.737128] SLUB: HWalign=64, Order=0-3, MinObjects=0, CPUs=128, Nodes=1 # 啊哈！slub缓存器
[    0.737308] ftrace: allocating 49155 entries in 193 pages
[    0.748068] ftrace: allocated 193 pages with 3 groups
```

1.  初始化为了高性能运转的RCU机制：

> RCU全称Read-Copy-Update，是linux内核中实现的一种可扩展的高性能同步机制，其功能是希望**读线程**没有同步开销，或者让同步开销变得很小，不需要使用原子操作指令和内存屏障，即可访问；而把需要同步的任务交给**写线程**，写线程等待所有读线程完成后才会把旧数据销毁。**RCU原理可概括为：RCU记录了所有指向共享数据的指针的使用者，当要修改共享数据时，首先会创建一个副本，在副本中修改，当所有读访问线程都离开读临界区之后，指针将指向新修改后副本的指针，并且删除旧的数据。**

```text
[    0.750281] rcu: Preemptible hierarchical RCU implementation.
[    0.750283] rcu:     RCU restricting CPUs from NR_CPUS=320 to nr_cpu_ids=128.
[    0.750284] rcu:     RCU priority boosting: priority 1 delay 500 ms.
[    0.750285]  Trampoline variant of Tasks RCU enabled.
[    0.750286]  Rude variant of Tasks RCU enabled.
[    0.750286]  Tracing variant of Tasks RCU enabled.
[    0.750287] rcu: RCU calculated value of scheduler-enlistment delay is 30 jiffies.
[    0.750288] rcu: Adjusting geometry for rcu_fanout_leaf=16, nr_cpu_ids=128
[    0.754050] NR_IRQS: 20736, nr_irqs: 1448, preallocated irqs: 16
[    0.754473] rcu: srcu_init: Setting srcu_struct sizes to big.
[    0.754851] kfence: initialized - using 2097152 bytes for 255 objects at 0x(____ptrval____)-0x(____ptrval____)
```

1.  TTY0中断初始化

```text
[    0.755117] Console: colour dummy device 80x25
[    0.755120] printk: legacy console [tty0] enabled
```

1.  初始化fpu等系统组件

```text
[    0.755263] ACPI: Core revision 20230628
[    0.755845] clocksource: hpet: mask: 0xffffffff max_cycles: 0xffffffff, max_idle_ns: 133484882848 ns
[    0.755959] APIC: Switch to symmetric I/O mode setup
[    0.756295] x2apic enabled
[    0.756623] APIC: Switched APIC routing to: physical x2apic
[    0.758386] ..TIMER: vector=0x30 apic1=0 pin1=2 apic2=-1 pin2=-1
[    0.758433] clocksource: tsc-early: mask: 0xffffffffffffffff max_cycles: 0x2e09c06b889, max_idle_ns: 440795314250 ns
[    0.758438] Calibrating delay loop (skipped) preset value.. 6390.94 BogoMIPS (lpj=10646307)
[    0.758943] x86/cpu: User Mode Instruction Prevention (UMIP) activated
[    0.759031] unchecked MSR access error: RDMSR from 0x852 at rIP: 0xffffffff89691387 (native_read_msr+0x7/0x40)
[    0.759037] Call Trace:
[    0.759039]  <TASK>
[    0.759041]  ? ex_handler_msr+0x121/0x130
[    0.759044]  ? fixup_exception+0x234/0x310
[    0.759045]  ? gp_try_fixup_and_notify+0x1e/0xc0
[    0.759048]  ? exc_general_protection+0x162/0x450
[    0.759052]  ? asm_exc_general_protection+0x26/0x30
[    0.759056]  ? native_read_msr+0x7/0x40
[    0.759058]  native_apic_msr_read+0x20/0x30
[    0.759061]  setup_APIC_eilvt+0x47/0x170
[    0.759065]  mce_amd_feature_init+0x47f/0x4f0
[    0.759068]  mcheck_cpu_init+0x19e/0x4a0
[    0.759071]  identify_cpu+0x3aa/0x600
[    0.759074]  arch_cpu_finalize_init+0x10/0x110
[    0.759078]  start_kernel+0x68f/0xaa0
[    0.759082]  x86_64_start_reservations+0x18/0x30
[    0.759085]  x86_64_start_kernel+0x96/0xa0
[    0.759087]  secondary_startup_64_no_verify+0x184/0x18b
[    0.759091]  </TASK>
[    0.759093] LVT offset 2 assigned for vector 0xf4
[    0.759094] [Firmware Bug]: cpu 0, try to use APIC520 (LVT offset 2) for vector 0xf4, but the register is already in use for vector 0x0 on this cpu
[    0.759112] Last level iTLB entries: 4KB 512, 2MB 512, 4MB 256
[    0.759114] Last level dTLB entries: 4KB 2048, 2MB 2048, 4MB 1024, 1GB 0
[    0.759117] Spectre V1 : Mitigation: usercopy/swapgs barriers and __user pointer sanitization
[    0.759119] Spectre V2 : Mitigation: Retpolines
[    0.759120] Spectre V2 : Spectre v2 / SpectreRSB mitigation: Filling RSB on context switch
[    0.759120] Spectre V2 : Spectre v2 / SpectreRSB : Filling RSB on VMEXIT
[    0.759122] Spectre V2 : mitigation: Enabling conditional Indirect Branch Prediction Barrier
[    0.759123] Speculative Store Bypass: Vulnerable
[    0.759124] Speculative Return Stack Overflow: IBPB-extending microcode not applied!
[    0.759125] Speculative Return Stack Overflow: WARNING: See https://kernel.org/doc/html/latest/admin-guide/hw-vuln/srso.html for mitigation options.
[    0.759126] Speculative Return Stack Overflow: Vulnerable: Safe RET, no microcode
[    0.759175] x86/fpu: Supporting XSAVE feature 0x001: 'x87 floating point registers'
[    0.759176] x86/fpu: Supporting XSAVE feature 0x002: 'SSE registers'
[    0.759177] x86/fpu: Supporting XSAVE feature 0x004: 'AVX registers'
[    0.759178] x86/fpu: xstate_offset[2]:  576, xstate_sizes[2]:  256
[    0.759179] x86/fpu: Enabled xstate features 0x7, context size is 832 bytes, using 'compacted' format.
[    0.786020] Freeing SMP alternatives memory: 40K
[    0.786025] pid_max: default: 131072 minimum: 1024
[    0.787375] ------------[ cut here ]------------
[    0.787377] CPA detected W^X violation: 8000000000000063 -> 0000000000000063 range: 0x000000000ff06000 - 0x000000000ff06fff PFN ff06
[    0.787424] WARNING: CPU: 0 PID: 0 at arch/x86/mm/pat/set_memory.c:645 __change_page_attr_set_clr+0xef8/0x1030
[    0.787431] Modules linked in:
[    0.787434] CPU: 0 PID: 0 Comm: swapper/0 Not tainted 6.8.8-arch1-1 #1 6e5d9eb17edb3e2ef7f1d13e0aec4b6c1833b648
[    0.787437] Hardware name: VMware, Inc. VMware7,1/440BX Desktop Reference Platform, BIOS VMW71.00V.18452719.B64.2108091906 08/09/2021
[    0.787439] RIP: 0010:__change_page_attr_set_clr+0xef8/0x1030
[    0.787442] Code: 89 f9 48 89 c2 48 89 44 24 08 48 c7 c7 a8 85 c3 8a c6 05 85 49 f2 01 01 4c 8d 86 ff 0f 00 00 48 89 f1 4c 89 d6 e8 68 66 01 00 <0f> 0b 48 8b 44 24 08 e9 52 fc ff ff 4d 89 f3 48 8b 15 fa a1 63 01
[    0.787444] RSP: 0000:ffffffff8b403c68 EFLAGS: 00010282
[    0.787447] RAX: 0000000000000000 RBX: 000000000ff06063 RCX: ffff9a9dbfeee8a8
[    0.787449] RDX: 0000000000000000 RSI: 00000000ffff7fff RDI: 0000000000000001
[    0.787450] RBP: 800000000ff06063 R08: 0000000000000000 R09: ffffffff8b403af8
[    0.787452] R10: ffffffff8b403af0 R11: 0000000000000003 R12: ffffffff8bb55930
[    0.787454] R13: 0000000000000050 R14: 0000000000000001 R15: 000000000000ff06
[    0.787455] FS:  0000000000000000(0000) GS:ffff9a9db5e00000(0000) knlGS:0000000000000000
[    0.787457] CS:  0010 DS: 0000 ES: 0000 CR0: 0000000080050033
[    0.787459] CR2: ffff9a9cafc03000 CR3: 000000012ee20000 CR4: 0000000000350ef0
[    0.787462] Call Trace:
[    0.787465]  <TASK>
[    0.787466]  ? __change_page_attr_set_clr+0xef8/0x1030
[    0.787469]  ? __warn+0x81/0x130
[    0.787474]  ? __change_page_attr_set_clr+0xef8/0x1030
[    0.787477]  ? report_bug+0x171/0x1a0
[    0.787481]  ? prb_read_valid+0x1b/0x30
[    0.787485]  ? srso_alias_return_thunk+0x5/0xfbef5
[    0.787489]  ? handle_bug+0x3c/0x80
[    0.787492]  ? exc_invalid_op+0x17/0x70
[    0.787495]  ? asm_exc_invalid_op+0x1a/0x20
[    0.787499]  ? __pfx_efi_update_mem_attr+0x10/0x10
[    0.787505]  ? __change_page_attr_set_clr+0xef8/0x1030
[    0.787508]  ? __change_page_attr_set_clr+0xef8/0x1030
[    0.787514]  ? __pfx_efi_update_mem_attr+0x10/0x10
[    0.787517]  kernel_map_pages_in_pgd+0xa7/0x110
[    0.787523]  efi_update_mappings+0x36/0xa0
[    0.787527]  ? __pfx_efi_update_mem_attr+0x10/0x10
[    0.787530]  efi_memattr_apply_permissions+0x20e/0x370
[    0.787537]  efi_enter_virtual_mode+0x212/0x4e0
[    0.787541]  start_kernel+0x973/0xaa0
[    0.787546]  x86_64_start_reservations+0x18/0x30
[    0.787556]  x86_64_start_kernel+0x96/0xa0
[    0.787559]  secondary_startup_64_no_verify+0x184/0x18b
[    0.787566]  </TASK>
[    0.787567] ---[ end trace 0000000000000000 ]---
[    0.787815] LSM: initializing lsm=capability,landlock,lockdown,yama,bpf,integrity
[    0.787853] landlock: Up and running.
[    0.787854] Yama: becoming mindful.
[    0.787860] LSM support for eBPF active
[    0.788205] Mount-cache hash table entries: 16384 (order: 5, 131072 bytes, linear)
[    0.788436] Mountpoint-cache hash table entries: 16384 (order: 5, 131072 bytes, linear)
[    0.789697] smpboot: CPU0: AMD Ryzen 7 5800H with Radeon Graphics (family: 0x19, model: 0x50, stepping: 0x0)
[    0.790536] RCU Tasks: Setting shift to 7 and lim to 1 rcu_task_cb_adjust=1.
[    0.790593] RCU Tasks Rude: Setting shift to 7 and lim to 1 rcu_task_cb_adjust=1.
[    0.790723] RCU Tasks Trace: Setting shift to 7 and lim to 1 rcu_task_cb_adjust=1.
[    0.790843] Performance Events: AMD PMU driver.
[    0.790906] ... version:                0
[    0.790907] ... bit width:              48
[    0.790908] ... generic registers:      4
[    0.790909] ... value mask:             0000ffffffffffff
[    0.790911] ... max period:             00007fffffffffff
[    0.790912] ... fixed-purpose events:   0
[    0.790913] ... event mask:             000000000000000f
[    0.791102] signal: max sigframe size: 1776
[    0.791185] rcu: Hierarchical SRCU implementation.
[    0.791187] rcu:     Max phase no-delay instances is 1000.
[    0.793187] NMI watchdog: Enabled. Permanently consumes one hw-PMU counter. 
```

1.  SMP机制初始化

```text
[    0.800248] smp: Bringing up secondary CPUs ...
[    0.800841] smpboot: x86: Booting SMP configuration:
[    0.800843] .... node  #0, CPUs:          #1   #2   #3
。。。
```

1.  DMA（也就是内存外存直通车机制）初始化

```text
[    0.820223] DMA: preallocated 1024 KiB GFP_KERNEL pool for atomic allocations
[    0.821769] DMA: preallocated 1024 KiB GFP_KERNEL|GFP_DMA pool for atomic allocations
[    0.823306] DMA: preallocated 1024 KiB GFP_KERNEL|GFP_DMA32 pool for atomic allocations
[    0.823317] audit: initializing netlink subsys (disabled)
# 这里安排了为DMA提供多大内存映射！1MB大小
```

1.  接入外设，初始化PCI总线上的一大堆设备：

```text
[    0.835739] ACPI: Added _OSI(Module Device)
[    0.835741] ACPI: Added _OSI(Processor Device)
[    0.835742] ACPI: Added _OSI(3.0 _SCP Extensions)
[    0.835744] ACPI: Added _OSI(Processor Aggregator Device)
[    0.868436] ACPI: 1 ACPI AML tables successfully acquired and loaded
[    0.872132] ACPI: [Firmware Bug]: BIOS _OSI(Linux) query ignored
[    0.872143] ACPI: BIOS _OSI(Darwin) query ignored
[    0.875392] ACPI: _OSC evaluation for CPUs failed, trying _PDC
[    0.907570] ACPI: Interpreter enabled
[    0.907586] ACPI: PM: (supports S0 S1 S4 S5)
[    0.907588] ACPI: Using IOAPIC for interrupt routing
[    0.908436] PCI: ECAM [mem 0xe0000000-0xe7ffffff] (base 0xe0000000) for domain 0000 [bus 00-7f]
[    0.909374] PCI: ECAM [mem 0xe0000000-0xe7ffffff] reserved as ACPI motherboard resource
[    0.909386] PCI: Using host bridge windows from ACPI; if necessary, use "pci=nocrs" and report a bug
[    0.909387] PCI: Using E820 reservations for host bridge windows
[    0.911491] ACPI: Enabled 4 GPEs in block 00 to 0F
[    1.192489] ACPI: PCI Root Bridge [PCI0] (domain 0000 [bus 00-7f])
[    1.192498] acpi PNP0A03:00: _OSC: OS supports [ExtendedConfig ASPM ClockPM Segments MSI EDR HPX-Type3]
[    1.192627] acpi PNP0A03:00: _OSC: platform does not support [AER LTR DPC]
[    1.192968] acpi PNP0A03:00: _OSC: OS now controls [PCIeHotplug SHPCHotplug PME PCIeCapability]
[    1.194177] PCI host bridge to bus 0000:00
[    1.194180] pci_bus 0000:00: root bus resource [io  0x0d00-0xffff window]
[    1.194182] pci_bus 0000:00: root bus resource [io  0x0000-0x0cf7 window]
[    1.194184] pci_bus 0000:00: root bus resource [mem 0xfef00000-0xffdfffff window]
...
```

1.  再一次排查内存，APIC和PIC总线设备映射了一些内存到RAM上，这就要求我们务必再一次排查内存

```text
[    1.659318] e820: reserve RAM buffer [mem 0x0c2c6018-0x0fffffff]
[    1.659336] e820: reserve RAM buffer [mem 0x0e609018-0x0fffffff]
[    1.659338] e820: reserve RAM buffer [mem 0x0e60b018-0x0fffffff]
[    1.659339] e820: reserve RAM buffer [mem 0x0e656000-0x0fffffff]
[    1.659341] e820: reserve RAM buffer [mem 0x0efab000-0x0fffffff]
[    1.659342] e820: reserve RAM buffer [mem 0x0efbd000-0x0fffffff]
[    1.659343] e820: reserve RAM buffer [mem 0x0fee6000-0x0fffffff]
```

1.  开始注册IRQ，你熟悉的

```text
[    1.422344] ACPI: PCI: Interrupt link LNKA configured for IRQ 0
[    1.422346] ACPI: PCI: Interrupt link LNKA disabled # 顺手disable了！这个时候内核还在初始化
[    1.422428] ACPI: PCI: Interrupt link LNKB configured for IRQ 0
[    1.422430] ACPI: PCI: Interrupt link LNKB disabled
[    1.422508] ACPI: PCI: Interrupt link LNKC configured for IRQ 0
[    1.422510] ACPI: PCI: Interrupt link LNKC disabled
[    1.422591] ACPI: PCI: Interrupt link LNKD configured for IRQ 0
[    1.422594] ACPI: PCI: Interrupt link LNKD disabled
```

1.  并行的，初始化网络子系统

```text
[    1.720347] NET: Registered PF_INET protocol family
[    1.722277] IP idents hash table entries: 131072 (order: 8, 1048576 bytes, linear)
[    1.737287] tcp_listen_portaddr_hash hash table entries: 4096 (order: 4, 65536 bytes, linear)
[    1.737307] Table-perturb hash table entries: 65536 (order: 6, 262144 bytes, linear)
[    1.737335] TCP established hash table entries: 65536 (order: 7, 524288 bytes, linear)
[    1.741297] TCP bind hash table entries: 65536 (order: 9, 2097152 bytes, linear)
[    1.741392] TCP: Hash tables configured (established 65536 bind 65536)
[    1.742373] MPTCP token hash table entries: 8192 (order: 5, 196608 bytes, linear)
[    1.742400] UDP hash table entries: 4096 (order: 5, 131072 bytes, linear)
[    1.742617] UDP-Lite hash table entries: 4096 (order: 5, 131072 bytes, linear)
```

​很多常见的协议这里就开始初始化工作了！这里初始化的是哈希表，干嘛的？之后网络服务分配端口用的！端口从这些hash table中取出来！

1.  初始化挂载文件系统：感谢我的一位大爹推介，我给root挂的是Brtfs，不是Ext4文件系统（），这里可以看到它把文件系统挂载在了sda3硬盘分区上，而且校验机制是32为CRC循环校验码

```text
[    3.278244] Btrfs loaded, zoned=yes, fsverity=yes
[    3.321572] BTRFS: device label ArchLinux devid 1 transid 3897 /dev/sda3 scanned by mount (191)
[    3.322361] BTRFS info (device sda3): first mount of filesystem c6ae9e8b-6dd3-4a7b-99bf-fcedbd6ab74c
[    3.322370] BTRFS info (device sda3): using crc32c (crc32c-intel) checksum algorithm 
[    3.322374] BTRFS info (device sda3): using free-space-tree
```

1.  Systemd开始工作：

```text
[    3.485381] systemd[1]: systemd 255.5-3-arch running in system mode (+PAM +AUDIT -SELINUX -APPARMOR -IMA +SMACK +SECCOMP +GCRYPT +GNUTLS +OPENSSL +ACL +BLKID +CURL +ELFUTILS +FIDO2 +IDN2 -IDN +IPTC +KMOD +LIBCRYPTSETUP +LIBFDISK +PCRE2 +PWQUALITY +P11KIT +QRENCODE +TPM2 +BZIP2 +LZ4 +XZ +ZLIB +ZSTD +BPF_FRAMEWORK +XKBCOMMON +UTMP -SYSVINIT default-hierarchy=unified)
[    3.485385] systemd[1]: Detected virtualization vmware.
[    3.485444] systemd[1]: Detected architecture x86-64.
[    3.487031] systemd[1]: Hostname set to <ArchLinux>.
[    3.920722] systemd[1]: bpf-lsm: LSM BPF program attached
[    4.211409] systemd[1]: Queued start job for default target Graphical Interface.
[    4.258091] systemd[1]: Created slice Slice /system/dirmngr.
[    4.258751] systemd[1]: Created slice Slice /system/getty.
[    4.259320] systemd[1]: Created slice Slice /system/gpg-agent.
[    4.259910] systemd[1]: Created slice Slice /system/gpg-agent-browser.
[    4.260527] systemd[1]: Created slice Slice /system/gpg-agent-extra.
[    4.261419] systemd[1]: Created slice Slice /system/gpg-agent-ssh.
[    4.262026] systemd[1]: Created slice Slice /system/keyboxd.
[    4.262596] systemd[1]: Created slice Slice /system/modprobe.
[    4.263159] systemd[1]: Created slice User and Session Slice.
[    4.263275] systemd[1]: Started Forward Password Requests to Wall Directory Watch.
[    4.263462] systemd[1]: Set up automount Arbitrary Executable File Formats File System Automount Point.
[    4.263503] systemd[1]: Expecting device /dev/disk/by-
...
```

​这里开始就是启动守护进程来观察剩下的子系统的建立：比如说文件系统的彻底初始化，网络子系统的彻底初始化

```text
[    4.263527] systemd[1]: Reached target Login Prompts.    # 登录脚本获取
[    4.263537] systemd[1]: Reached target Local Integrity Protected Volumes.
[    4.263553] systemd[1]: Reached target Remote File Systems.
[    4.263559] systemd[1]: Reached target Slice Units.
[    4.263575] systemd[1]: Reached target Local Verity Protected Volumes.
[    4.263645] systemd[1]: Listening on Device-mapper event daemon FIFOs.
[    4.266006] systemd[1]: Listening on Process Core Dump Socket.
[    4.266159] systemd[1]: Listening on Journal Socket (/dev/log).
[    4.266275] systemd[1]: Listening on Journal Socket.
[    4.266305] systemd[1]: TPM2 PCR Extension (Varlink) was skipped because of an unmet condition check (ConditionSecurity=measured-uki).
[    4.267123] systemd[1]: Listening on udev Control Socket. # udev程序开始工作：udev管理设备接入的
[    4.267225] systemd[1]: Listening on udev Kernel Socket.
[    4.267324] systemd[1]: Listening on User Database Manager Socket.
[    4.269352] systemd[1]: Mounting Huge Pages File System...
[    4.271193] systemd[1]: Mounting POSIX Message Queue File System...
[    4.272566] systemd[1]: Mounting Kernel Debug File System...
[    4.275675] systemd[1]: Mounting Kernel Trace File System...
[    4.277280] systemd[1]: Starting Create List of Static Device Nodes...
```

1.  内核模块挂载功能的初始化，已经注册的模块的初始化

```text
[    4.278792] systemd[1]: Starting Load Kernel Module configfs... # 开始初始化内核模块挂载初始化
[    4.282344] systemd[1]: Starting Load Kernel Module dm_mod...
[    4.287784] systemd[1]: Starting Load Kernel Module drm...
[    4.291169] systemd[1]: Starting Load Kernel Module fuse...
[    4.295357] systemd[1]: Starting Load Kernel Module loop...
[    4.300246] systemd[1]: Starting Journal Service...
[    4.303957] systemd[1]: Starting Load Kernel Modules...
[    4.303970] systemd[1]: TPM2 PCR Machine ID Measurement was skipped because of an unmet condition check (ConditionSecurity=measured-uki).
[    4.311843] device-mapper: uevent: version 1.0.3
[    4.311964] loop: module loaded
[    4.312243] systemd[1]: Starting Remount Root and Kernel File Systems...
[    4.312276] systemd[1]: TPM2 SRK Setup (Early) was skipped because of an unmet condition check (ConditionSecurity=measured-uki).
[    4.312986] device-mapper: ioctl: 4.48.0-ioctl (2023-03-01) initialised: dm-devel@redhat.com
[    4.314481] systemd[1]: Starting Coldplug All udev Devices...
[    4.317552] systemd[1]: Starting Virtual Console Setup...
[    4.319302] systemd[1]: Mounted Huge Pages File System.
[    4.319416] systemd[1]: Mounted POSIX Message Queue File System.
[    4.319518] systemd[1]: Mounted Kernel Debug File System.
[    4.319620] systemd[1]: Mounted Kernel Trace File System.
[    4.319938] systemd[1]: Finished Create List of Static Device Nodes.
[    4.320293] systemd[1]: modprobe@configfs.service: Deactivated successfully.
[    4.320449] systemd[1]: Finished Load Kernel Module configfs.
[    4.320851] systemd[1]: modprobe@dm_mod.service: Deactivated successfully.
[    4.321003] systemd[1]: Finished Load Kernel Module dm_mod.
[    4.321329] systemd[1]: modprobe@drm.service: Deactivated successfully.
[    4.321523] systemd[1]: Finished Load Kernel Module drm.
[    4.321818] systemd[1]: modprobe@fuse.service: Deactivated successfully.
[    4.321968] systemd[1]: Finished Load Kernel Module fuse.
[    4.322270] systemd[1]: modprobe@loop.service: Deactivated successfully.
[    4.322431] systemd[1]: Finished Load Kernel Module loop.
[    4.322464] systemd-journald[246]: Collecting audit messages is disabled.
[    4.327584] systemd[1]: Mounting FUSE Control File System...
[    4.331144] systemd[1]: Mounting Kernel Configuration File System...
[    4.331197] systemd[1]: Repartition Root Disk was skipped because no trigger condition checks were met.
[    4.333564] BTRFS info (device sda3: state M): use zstd compression, level 3
```

1.  最后的最后，我们使用已经初始化完成的设备管理子系统接入诸如声卡，网卡，蓝牙等设备

```text
[    5.160970] e1000: Intel(R) PRO/1000 Network Driver
[    5.160973] e1000: Copyright (c) 1999-2006 Intel Corporation.
[    5.161298] e1000 0000:02:01.0: enabling device (0110 -> 0113)
[    5.166576] Guest personality initialized and is active
[    5.166621] VMCI host device registered (name=vmci, major=10, minor=123)
[    5.166623] Initialized host personality
# 声卡
[    5.199128] input: PC Speaker as /devices/platform/pcspkr/input/input4
[    5.252008] input: VirtualPS/2 VMware VMMouse as /devices/platform/i8042/serio1/input/input6
[    5.252656] input: VirtualPS/2 VMware VMMouse as /devices/platform/i8042/serio1/input/input5
[    5.327777] cryptd: max_cpu_qlen set to 1000
[    5.370835] Bluetooth: Core ver 2.22
[    5.370927] NET: Registered PF_BLUETOOTH protocol family
# 蓝牙
[    5.370929] Bluetooth: HCI device and connection manager initialized
[    5.370933] Bluetooth: HCI socket layer initialized
[    5.370935] Bluetooth: L2CAP socket layer initialized
[    5.370939] Bluetooth: SCO socket layer initialized
[    5.375620] AVX2 version of gcm_enc/dec engaged.
[    5.376048] AES CTR mode by8 optimization enabled
[    5.424872] snd_ens1371 0000:02:02.0: enabling device (0000 -> 0001)
[    5.430767] usbcore: registered new interface driver btusb
[    5.478456] Bluetooth: hci0: unexpected cc 0x0c12 length: 2 < 3
[    5.478467] Bluetooth: hci0: Opcode 0x0c12 failed: -38
# 抓到的网卡配置，可以ifconfig查看
[    5.613099] e1000 0000:02:01.0 eth0: (PCI:66MHz:32-bit) 00:0c:29:dc:f5:a8
[    5.613109] e1000 0000:02:01.0 eth0: Intel(R) PRO/1000 Network Connection
[    5.623326] e1000 0000:02:01.0 ens33: renamed from eth0
[    5.654147] e1000: ens33 NIC Link is Up 1000 Mbps Full Duplex, Flow Control: None
[    6.446371] bridge: filtering via arp/ip/ip6tables is no longer available by default. Update your scripts to load br_netfilter if you need this.
[    6.451480] Bridge firewalling registered
[    6.555526] Initializing XFRM netlink socket
[   74.611975] systemd-journald[246]: /var/log/journal/deaaebab639c462183f85623319ae5fc/user-1000.journal: Journal file uses a different sequence number ID, rotating.
[  273.008400] systemd[1]: systemd 255.5-4-arch running in system mode (+PAM +AUDIT -SELINUX -APPARMOR -IMA +SMACK +SECCOMP +GCRYPT +GNUTLS +OPENSSL +ACL +BLKID +CURL +ELFUTILS +FIDO2 +IDN2 -IDN +IPTC +KMOD +LIBCRYPTSETUP +LIBFDISK +PCRE2 +PWQUALITY +P11KIT +QRENCODE +TPM2 +BZIP2 +LZ4 +XZ +ZLIB +ZSTD +BPF_FRAMEWORK +XKBCOMMON +UTMP -SYSVINIT default-hierarchy=unified)
[  273.008505] systemd[1]: Detected virtualization vmware.
[  273.008596] systemd[1]: Detected architecture x86-64.
[  273.424093] systemd[1]: bpf-lsm: LSM BPF program attached
[  352.419139] perf: interrupt took too long (2590 > 2500), lowering kernel.perf_event_max_sample_rate to 77100
[  390.817032] perf: interrupt took too long (3500 > 3237), lowering kernel.perf_event_max_sample_rate to 57000
[  527.871009] perf: interrupt took too long (4415 > 4375), lowering kernel.perf_event_max_sample_rate to 45300
```

到此位置，整个系统初始化完成，可以登录了！

