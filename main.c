#include <stdio.h>
#include <stdlib.h>
#include "myBank.h"
#include "myBank.c"


int main()
{

    printf("Enter O for Opening Account.\nEnter B for Getting Balance.\nEnter D for Deposit.\nEnter W for Withrawal.\n");
    printf("Enter C for Closing Account.\nEnter I for Adding Interest.\nEnter P for Printing all open accounts.\nEnter E for Exit.\n");
       
    int stop=0;
    char input=' ';
     while (stop==0)
    {
        printf("Choose desired action:\n");
        scanf(" %c",&input);
        float sum = 0;
        int acc_num = 0;
        switch (input)
        {
        case 'O':
            printf("How much would you like to deposit?\n");
            scanf("%f", &sum);
            //acc_num is the new number of the account
            acc_num = openAcc(sum);
            //if opening new acc was successful
            if(acc_num!=-1)
                printf("Account number is: %d\n",acc_num);
            break;
        case 'B':
            printf("You chose to get the balance of an account.\nPlease insert the account's number:\n");
            scanf("%d",&acc_num);
            if(acc_num!=-1)
            {
                printf("Account number %d has in it: %.2f\n",acc_num,amount(acc_num));
            }
            break;
        case 'D':
            printf("You chose to deposit money. Insert account number: ");
            scanf("%d",&acc_num);
            printf("How much money would you like to deposit? ");
            scanf("%f",&sum);
            deposit(acc_num,sum);
            if (deposit(acc_num,sum)!=-1){
                printf("The new amount of money in you account is: %.2f\n",amount(acc_num));
            }
            break;
        case 'W':
            printf("You chose to withdraw money. Insert account number: ");
            scanf("%d",&acc_num);
            printf("How much money do you want to withdraw?\n ");
            scanf("%f",&sum);
            if (withdrawl(acc_num,sum)!=-1)
                printf("This is the amount of money left in your account: %f\n",amount(acc_num));
            break;
        case 'C':
            printf("You chose to close your account. Please insert account number:\n");
            scanf("%d",&acc_num);
            closeAcc(acc_num);
            break;
        case 'I':
            printf("What is the interest rate?\n");
            scanf("%f",&sum);
            interest(sum);
            break;
        case 'P':
            printBalance();
            break;
        case 'E':
            closeAll();
            stop=1;
            printf("Thank you for your visit. Goodbye!");
            break;
        }
    }
    return 0;
}



