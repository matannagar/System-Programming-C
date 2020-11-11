#include <stdio.h>
#include "myMath.h"
#include "basicMath.c"
#include "power.c"

double firstFun(double);
double secFun(double);
double thirdFun(double);

int main()
{
printf("Please insert a real number: ");
double par;
scanf("%lf",&par);
printf("Function No.1 is : F(x)=e^x+x^3-2\n");
double res= firstFun(par);
printf("The answer is: %.4lf\n",res);

printf("Function No.2 is : F(x)=3x+2x^2\n");
double res1= secFun(par);
printf("The answer is: %.4lf\n",res1);

printf("Function No.3 is : F(x)=(4x^3)/5-2x\n");
double res2=thirdFun(par);
printf("The answer is: %.4lf\n",res2);

return 0;
}

double firstFun(double par)
{
    double res;
    res = sub(add(Exponent((int)par), Power(par,3)), 2);
    return res;
}
double secFun(double par)
{
    double res;
    res = add(mul(par,3),mul(Power(par,2),2));
    return res;
}
double thirdFun(double x)
{
    double res;
    res = sub(divi(mul(Power(x,3),4),5),mul(x,2));
    return res;
}
