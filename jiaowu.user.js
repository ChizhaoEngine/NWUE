// ==UserScript==
// @name         NWUE
// @namespace    https://github.com/ChizhaoEngine/NWUE
// @version      0.1.7
// @description  你猜猜看这是干什么的
// @author       池沼动力
// @license      CC BY-NC-ND 4.0
// @match        *jwgl.nwu.edu.cn/jwglxt/*
// @icon         https://s2.loli.net/2023/07/12/EDN5F4cGukt8XeP.png
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_getResourceURL
// @grant        GM_getResourceText
// @grant        GM_registerMenuCommand
// @grant        GM.setClipboard
// @grant        GM_addStyle
// @connect      *jwgl.nwu.edu.cn*
// @updateURL    https://ghproxy.homeboyc.cn/https://github.com/ChizhaoEngine/NWUE/raw/main/jiaowu.user.js
// @downloadURL  https://ghproxy.homeboyc.cn/https://github.com/ChizhaoEngine/NWUE/raw/main/jiaowu.user.js



// ==/UserScript==

(function () {
    'use strict';

    // ----------------------------
    // 登录页优化
    // ----------------------------
    if (window.location.href.includes('jwgl.nwu.edu.cn/jwglxt/xtgl/login_slogin.html')) {
        // 允许密码框粘贴
        $("#mm").unbind("copy paste cut");
        // 移除autocomplete属性
        let passwordInputs = document.querySelectorAll('input');
        for (let i = 0; i < passwordInputs.length; i++) {
            passwordInputs[i].removeAttribute('autocomplete');
        }
        let inputArr = document.querySelectorAll('input');
        for (let i = 15; i < 21; i++) {
            if (!inputArr[i].classList.contains('form-control')) {
                inputArr[i].remove();
            }
        }
    }

    // ----------------------------
    // 选课
    // ----------------------------
    if (window.location.href.includes('jwgl.nwu.edu.cn/jwglxt/xsxk/zzxkyzb_cxZzxkYzbIndex.html')) {

        let type = '体育分项';
        // 还没做完，选课系统就关了，操蛋，先咕咕了
        // window.addEventListener('load', function () {
        //     if (loadList(type) === true) {
        //         loadMoreList();
        //     } else {
        //         this.window.location.reload();
        //     }
        // });


        // 检测是否出来分项了，没有则刷新，有则点击项目
        function loadList(type) {
            let eles = document.querySelectorAll('.nav.nav-tabs.sl_nav_tabs li');
            for (let element of eles) {
                if (!element.classList.contains('active') && element.querySelector('a').innerHTML === type) {
                    element.querySelector('a').click();
                    console.log('1');
                    return true;

                }
            };
        }

        // 若列表没加载完，则点击更多
        function loadMoreList() {
            console.log('sb');
            let element = document.getElementById('more');
            while (element.getAttribute('style') === 'text-align: center;') {
                element.querySelector('font a').click();
            }
        }
        // 根据教学班名称，点击按钮
        function clickFastAddClass(className) {
            document.querySelectorAll('.body_tr').forEach(function (element) {
                if (element.querySelector('.clj.showJc').innerHTML === className && element.querySelector('.btn.btn-primary.btn-sm').innerHTML === '选课') {
                    element.querySelector('.btn.btn-primary.btn-sm').click();
                }
            });

        }
    }






    // ----------------------------
    // 查询成绩
    // ----------------------------
    if (window.location.href.includes('jwgl.nwu.edu.cn/jwglxt/cjcx/cjcx_cxDgXscj.html')) {
        GM_addStyle(`
    .sbxxw table {
        border-collapse: collapse;
        width: 100%;
    }

    .sbxxw th, td {
        border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;
    }

    .sbxxw th {
        background-color: #f2f2f2;
    }
    `);
        document.getElementById("search_go").addEventListener("click", queryGrades);
        function queryGrades() {

            let stuNum = 0;
            let year = 0;
            let term = 0;
            // 学号，学年起始年，第一学期3或第二学期12


            // 获取学号
            const urlParams = new URLSearchParams(window.location.search);
            stuNum = urlParams.get('su');


            //判断查询学年
            year = document.getElementsByClassName('chosen-single')[0].querySelector('span').innerHTML.split('-')[0];

            // 判断查询学期
            let queryTerm = document.getElementsByClassName('chosen-single')[1].querySelector('span').innerHTML;
            if (queryTerm === '1') {
                term = 3;
            } else if (queryTerm === '2') {
                term = 12;
            } else if (queryTerm === '全部') {
                term = undefined;
            }
            // 删除前次查询表格
            if (document.getElementById('sb250') != undefined) {
                document.getElementById('sb250').remove();
            }
            // 添加正在查询提示
            let onloadText = document.createElement('p');
            onloadText.innerHTML = '[NWUE] 正在发送请求';
            document.getElementById('innerContainer').appendChild(onloadText);

            // 发送请求
            GM_xmlhttpRequest({
                method: "POST",
                url: "http://jwgl.nwu.edu.cn/jwglxt/cxbm/cxbm_cxXscxbmList.html?gnmkdm=N1056&su=" + stuNum,
                data: "cxxnm=" + year + "&cxxqm=" + term + "&_search=false&nd=" + Date.now() + "&queryModel.showCount=100&queryModel.currentPage=1&queryModel.sortName=cj&queryModel.sortOrder=asc&time=0",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                onload: function (response) {
                    if (response.status === 200 && response.response != undefined) {
                        // console.log(response.responseText);
                        onloadText.innerHTML = '[NWUE] 查询成功';
                        // 处理相应数据
                        let json = JSON.parse(response.responseText);
                        let result = { 'grades': [], 'conclude': { 'classSum': 0, 'gpa': 0} };
                        // let result.grades = [];
                        // 计算学分总和和绩点总和
                        let creditsCac =0;
                        let gpaCac = 0;
                        for (let i = 0; i < json.items.length; i++) {
                            //没成绩就是没修的课
                            if (json.items[i].cj != null) {
                                result.grades.push({
                                    year: json.items[i].cxxnmc,
                                    term: json.items[i].cxxqmc,
                                    classNum: json.items[i].kch,
                                    className: json.items[i].kcmc.split("<br>")[0],
                                    xuefen: json.items[i].xf,
                                    grade: json.items[i].cj,
                                    jidian: json.items[i].jd,
                                    xuefenJidian: (json.items[i].xf * 10) * (json.items[i].jd * 10) / 100
                                });
                                // 学分累加
                                creditsCac += json.items[i].xf*10;
                                // 绩点累加
                                gpaCac += (json.items[i].xf * 10) * (json.items[i].jd * 10) / 100;
                            }
                            // 仍然没有找到女朋友的希望
                        }
                        // 总课程数
                        result.conclude.classSum = result.grades.length;
                        // 加权绩点
                        result.conclude.gpa = gpaCac/ (creditsCac/10);
                        // 学分和
                        // result.conclude.creditsSum = ;
                        // console.log(result.grades);

                        // 生成表格
                        let rowHTML = `
                <thead>
                    <tr>
                        <th>学年</th>
                        <th>学期</th>
                        <th>课程编号</th>
                        <th>课程名称</th>
                        <th>学分</th>
                        <th>成绩</th>
                        <th>绩点</th>
                        <th>学分绩点</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
                `;
                        let table = document.createElement('table');
                        table.id = 'sb250';
                        table.className = 'sbxxw';
                        table.innerHTML = rowHTML;
                        document.getElementById('innerContainer').appendChild(table);

                        // let table = document.getElementById("sb250");
                        for (let i = 0; i < result.grades.length; i++) {
                            let row = table.insertRow(i + 1);
                            let rowData = result.grades[i];

                            let yearCell = row.insertCell(0);
                            yearCell.innerHTML = rowData.year;

                            let termCell = row.insertCell(1);
                            termCell.innerHTML = rowData.term;

                            let classNumCell = row.insertCell(2);
                            classNumCell.innerHTML = rowData.classNum;

                            let classNameCell = row.insertCell(3);
                            classNameCell.innerHTML = rowData.className;

                            let creditsCell = row.insertCell(4);
                            creditsCell.innerHTML = rowData.xuefen;

                            let gradeCell = row.insertCell(5);
                            gradeCell.innerHTML = rowData.grade;

                            let gpaCell = row.insertCell(6);
                            gpaCell.innerHTML = rowData.jidian;

                            let creditsGpaCell = row.insertCell(7);
                            creditsGpaCell.innerHTML =rowData.xuefenJidian;
                            
                        }
                        let sumEle = document.createElement('p')
                        sumEle.innerHTML = `共${result.conclude.classSum}门课程，加权绩点为${result.conclude.gpa}`;
                        document.getElementById('innerContainer').appendChild(sumEle);

                    } else {
                        onloadText.innerHTML = '[NWUE] 返回异常：' + response.status;
                    }

                },
                onerror: function (error) {
                    onloadText.innerHTML = '[NWUE] 发送请求失败：' + error.message;

                }
            });
        }
    }
})();