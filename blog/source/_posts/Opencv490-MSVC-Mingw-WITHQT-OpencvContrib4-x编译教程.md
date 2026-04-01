---
title: "Opencv490+MSVC_Mingw+WITHQT+OpencvContrib4_x编译教程"
date: 2024-01-29
---

# OpenCV4.9.0 + 扩展 + WITH_QT（Qt6）模块编译教程（Windows）

​本篇教程是Opencv4.9.0 和 扩展Opencv Contrib4.x以及带上了WITH_QT选项的CMake编译环境配置和编译教程。注意到环境是Window11（10应该仍可以使用）。本篇教程将会导出Mingw版本的，和MSVC19版本的Debug和Release四套Opencv库的编译教程。各位读者可以根据自己的需求进行编译，或者是在本文最后的部分前往本人开设的Github仓库处下载已经编译好的资源和库直接进行使用。

## 前置的能力要求与说明

1.  本教程要求自己至少会翻墙，不会翻墙的话就不建议费心自己编译了，文章的最后有仓库直接嫖，当然如果是的确需要存在自己的编译需求的话，可以查询如何瞒过CMake的下载步骤（也就是贴MD5码瞒天过海），替换自己的下载的资源从而使得CMake正确的生成MakeFile。
2.  以及本教程需要提示您：本教程不生成opencvWorld这个巨无霸，因为他跟Contrib库的cvv可视化相互冲突，会存在依赖错配的问题导致大量的undefined reference，后续的配置种不需要cvv者可以不配置然后选择build_opencv_world，如果需要的话就只好忍耐生成大量的散装库了
3.  教程的配置顺序优先是Release，这点务必注意。

## 需要下载的资源

1.  Opencv4.9.0 `:>` [opencv/opencv at 4.9.0 (github.com)](https://github.com/opencv/opencv/tree/4.9.0)

```yaml
git clone https://github.com/opencv/opencv.git
```

1.  Opencv_Contrib4.x `:>` [opencv/opencv_contrib: Repository for OpenCV's extra modules (github.com)](https://github.com/opencv/opencv_contrib)

```yaml
    git clone https://github.com/opencv/opencv_contrib.git
```

2.  Qt:[Try Qt \| 开发应用程序和嵌入式系统 \| Qt](https://www.qt.io/zh-cn/download)直接下就行，但是先不要急着下啥组件，我后面会说。

​在网页Web和Windows Command命令行`(我喜欢用Powershell，这个因人而异)`中分别完成上述三个资源的下载。

> TIPS:如果你发现git被墙的厉害，可以使用代理工具配置IP和端口转发流量。这个需要查看你使用的代理软件（不会使用代理软件的话自行百度买节点，这里就不赘述怎么搞了），我的代理软件生成的Powershell的代理设置指令是：（`注！意！改！成！自！己！的！转！发！IP！和！端！口！`）
>
> ```
> $Env:http_proxy="http://127.0.0.1:7890";$Env:https_proxy="http://127.0.0.1:7890"
> ```
>
> ​ 惯用CMD用户可以根据自己的需求更改IP和端口
>
> ```
> set http_proxy=http://127.0.0.1:7890 & set https_proxy=http://127.0.0.1:7890
> ```
>
> ![image-20240129182906224](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129182906224.png)

​下载的时候记得泡杯茶喝喝。最近的话本人这里的网不太好，常常会丢包，多来几次就可以下载完整。两个包都比较大（Contrib包200多MB，Opencv本身的包达到了700多MB）

​下载结束，开始配置。

![image-20240129183645488](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129183645488.png)

## 配置编译器（WITH_QT用户看这个）

​下一步就是配置了，我们首先搞Qt的，我们特别需要注意的是，这篇教程的这个部分更加针对Qt6，Opencv的CMakeLists在这个版本中支持了Qt6，当然，选择Qt5也是可行的，事情更少。

​**Qt6用户在使用安装程序的时候需！要！注！意！请务必保证自己的安装中包含了下面的这些包：**

![image-20240129184036707](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129184036707.png)

​编译器包，这里根据自己希望的平台二选一，或者都选！

​另一方面，这里是Qt6用户务必保证的：

![image-20240129184225886](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129184225886.png)

​这个是需要的，兼容Qt5的库包是一定要下载的！否则会在后续的配置中出现这个错误，类比的，他报了少啥关于Qt的，就在这里下啥！一定一定要补全！否则编译不通过！

`error: Qt6::Core5Compat but the target was not found.`

​Qt5用户不需要管这个。

​下一步就是添加路径：

![image-20240129184532997](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129184532997.png)

​重点是lib库的路径，我们CMakeLists搜包需要这个文件下面的cmakeConfigFile。这也就提醒你：

> 如！果！你！是！两！种！库！都！编！译！请确保对应编译器的Lib路径是要被优先搜索到的！换而言之，保证你的lib库路径在Path里的头部！
>
> 赶时间不看，我说原因：这是因为我们的后面的编译种会涉及到库的连接，如果我们在配置Mingw的库却使用了MSVC下的lib的库，两种库的导出符号的命名规则完全不一致，将会出现大名鼎鼎的Undifined Reference错误，而其是刷屏级别的。

​按照这个架势，我们就是先处理Mingw的库了。

## 为CMakeLists设置代理

​Opencv在Config的流程种会出现下载库的情况，对于原生的Opencv会下载FFMPEG等库，为此，如果你手头有代理软件，请为CMake设置代理，在CMakeLists的首部添加：

```text
set(ENV{http_proxy} "http://127.0.0.1:7890")
set(ENV{https_proxy} "http://127.0.0.1:7890")
```

​别直接复制啊，看自己的IP和端口号

![image-20240129185327227](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129185327227.png)

​保存，打开CMake-Gui，开始配置。

## CMake 3.24配置(Mingw Release)

​推介使用CMake3.24而不是3.25,我先前使用会出现一个资源死活识别不出来然后发现是牛马的CMake的问题（Github Issue可以围观一手）

​我们添上对应的路径，看自己的：（然后建议像我这样勾上Advanced和Grouped方便等会找问题）

![image-20240129185610044](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129185610044.png)

​开始Configure，我们既然使用Mingw编译器，自然要的是Mingw-MakeFile，下一步就是使用指定的gcc和g++编译器。

![image-20240129185755487](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129185755487.png)

![image-20240129185804731](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129185804731.png)

​可以参考位置看看自己的gcc和g++在哪里。

![image-20240129185828981](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129185828981.png)

​确认，CMake开始扫描，检查编译条件。这个过程将会持续的很久，也会出现大量的有趣的错误。请随时留意自己的输出控制台有没有出现红色的东西。**而不是不负责任的一直点Configure让错误失踪**

![image-20240129190037032](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129190037032.png)

​这里就是让很多新手绊倒的地方，当我们完成CMake的代理配置后，可以发现这里不会报错，而是顺利的通过配置

​第一次配置结束，可以看到满山红。

![image-20240129190135182](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129190135182.png)

> 1.  检查自己的Install to，是你希望的路径吗？
> 2.  回看自己的 Configure过程出现过爆红吗，有的话可以点对点的找问题解决，笔者这里尚未出现，常见的可能的就是不设置代理导致必须存在的库没有被下载，这个网上已经存在大量的教程教你，这里不再演示！

## 配置自己的需求然后生成MakeFile

### 配置Contrib

​回忆我们的需求，我们要的是`opencv_contrib + WITH_QT`。所以第一步就是设置Opencv的Contrib路径

![image-20240129190457712](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129190457712.png)

![image-20240129190516432](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129190516432.png)

​输入自己的`conrtib/module`路径。

### 配置Qt（很重要，极易出现问题）

​勾选WITH_QT选项。

![image-20240129191233670](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129191233670.png)

### 再次Config观察输出台

​由于多出了Contrib库，还会下载不少的文件

![image-20240129191337336](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129191337336.png)

​文件也都比较大，考验流量。所以容易失败。

​配置结束，控制台没有出现红色的部分。检查上面的栏目，对于我们当前的配置需求我们只检查qt的就行。

![image-20240129191555836](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129191555836.png)

​OK，都是我们指定的路径，没问题。

​再次Config消红

![image-20240129191731747](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129191731747.png)

​很干净，没问题了。

​生成MakeFile。结束CMake的配置部分。

![image-20240129191830681](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129191830681.png)

​现在可以看到Opencv的build目录下文件丰富多彩，所以打开你的命令控制台，但走一个

### mingw32-make.exe -j14

​启动我们的编译。（注意：-j几看自己的机器，不然会出现部分线程超前编译的错误，导致出现未定义的错误。）

![image-20240129192024449](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129192024449.png)

​路上会出现很多的编译信息。

> 如果发生了错误，自行百度emmm，我第一编译出现了字符编码转化的问题，当然这个自己修修也就OK了。当然我们

![image-20240129193447380](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129193447380.png)

​单刷成功。

### 下载库:

```text
mingw32-make.exe install
```

![image-20240129193655531](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129193655531.png)

​整理文件，实际上我们用到的就是这些：

```text
.\build\install\x64\mingw
```

​下的bin和lib路径下的动态库和静态库和

```text
.\build\install\include\opencv2
```

​带着opencv2一块走记得。

## Mingw Debug版本

​MingW debug版本有一个需要注意的：就是在上面配置的基础上修改buildType和buildFlag。如你所见：

![image-20240129195602018](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129195602018.png)

​首先：`CMAKE_BUILD_TYPE:`改成`DEBUG`的类型。其次：

![image-20240129195703354](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129195703354.png)

​`CMAKE_CXX_FLAGS_DEBUG`的falgs那里改成`-g O1`，这是因为我们的编译的过程会产生大量的比较大的目标文件，一部分的目标文件体积过大导致无法被连接，我们不得不妥协一部分编译信息来保证我们的Debug库会被正确编译。

​没了，继续单走`mingw32-make.exe -j14`和`mingw32-make.exe install`

​老地方取库和头文件，这里不赘述了。

## MSVC Version

​在开始我们的MSVC版本的配置之前，请务必保证：

> 自己的Qt路径下是MSVC优先

​我们的第一个与Mingw的分歧点在于，我们需要更改为指定MSVC编译器进行编译，为此就需要使用Visual Studio的MSVC生成编译工程

![image-20240129202538684](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129202538684.png)

​请诸位读者自行选择自己的主机上存在的VS版本。然后配置即可：

![image-20240129202711235](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129202711235.png)

​笔者这里采用的是MSVC17`(Visual Studio 2022版本)`进行编译的。对于中间的下载文件的配置要求跟Mingw的完全一致，这里还是一样：注意开好自己的代理，仍然存在不同于Mingw的文件需要下载。

> 1.  检查自己的Install to，是你希望的路径吗？
> 2.  回看自己的 Configure过程出现过爆红吗，有的话可以点对点的找问题解决，笔者这里尚未出现，常见的可能的就是不设置代理导致必须存在的库没有被下载，这个网上已经存在大量的教程教你，这里不再演示！

## 配置自己的需求然后生成sln文件

### 配置Contrib

​回忆我们的需求，我们要的是`opencv_contrib + WITH_QT`。所以第一步就是设置Opencv的Contrib路径

![image-20240129190457712](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129190457712.png)

![image-20240129190516432](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129190516432.png)

​输入自己的`conrtib/module`路径。

### 配置Qt（很重要，极易出现问题）

​勾选WITH_QT选项。

![image-20240129191233670](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129191233670.png)

### 再次Config观察输出台

​由于多出了Contrib库，还会下载不少的文件

![image-20240129191337336](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129191337336.png)

​文件也都比较大，考验流量。所以容易失败。

​配置结束，控制台没有出现红色的部分。检查上面的栏目，对于我们当前的配置需求我们只检查qt的就行。

![image-20240129203345257](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129203345257.png)

​OK，都是我们指定的路径，没问题。

​再次Config消红

![image-20240129191731747](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129191731747.png)

​很干净，没问题了。然后Generate Done。

​回到build目录：

![image-20240129203509657](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129203509657.png)

​抓到这个目录，点击打开工程

![image-20240129203614573](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129203614573.png)

​第一件事情：确保是Release，第二件事情，点击生成`->`生成解决方案。

![image-20240129203755228](image-20240129203755228-1706532201669-2.png)

​很好，没毛病。

![image-20240129205837105](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129205837105.png)

​下一步就是下载：找到这个地方，对着Install目录项右键生成配置方案

![image-20240129204352307](/img/articles/2024-01-29-Opencv490-MSVC-Mingw-WITHQT-OpencvContrib4-x编译教程/image-20240129204352307.png)

## MSVC Debug

​我们类比的把CMakeLists的build type改成了DEBUG，然后注意在生成的时候需要选择DEBUG模式的生成，否则会产生生成和配置不符合的问题。当然后面就是雷同了。

