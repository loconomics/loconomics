using System;
using System.Collections.Generic;
using System.Web;
using System.Text.RegularExpressions;
/// 

/// My class validator
/// 

public class MyValidator{
        public static bool IsEmailAdress(string sEmail){
            if(sEmail!=""){
                var sRegex = new Regex(@"\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*");
                return sRegex.IsMatch(sEmail) ?true:false ;
        }else{
                return false ;
            }
    }
}