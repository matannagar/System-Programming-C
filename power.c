#include "myMath.h"
#define EXP 2.718281828

double Exponent(int x)
{
double expo = EXP;
double res;
res=Power(expo,x);
return res;
}



double Power(double base, int ex)
{
if (ex==0)
    return 1;

else if (ex<0)
    return (1 / Power(base,-ex));

else if (ex%2 ==0)
{
    double half_pow;
    half_pow = Power(base,ex/2);
    return half_pow*half_pow;
}
else
    return base*Power(base,ex-1);

}
